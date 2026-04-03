import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { role, location, experience } = await req.json()

    if (!role || role.trim().length < 2) {
      return NextResponse.json({ error: "Please enter a valid job title." }, { status: 400 })
    }

    const firecrawlKey = process.env.FIRECRAWL_API_KEY
    const groqKey = process.env.GROQ_API_KEY
    const rapidApiKey = process.env.RAPIDAPI_KEY

    const searchQuery = `${role} jobs ${location || "remote"} ${experience || ""}`.trim()

    // ── PRIMARY: Firecrawl + Groq pipeline for real, high-quality job data ──
    if (firecrawlKey && groqKey) {
      try {
        // Step 1: Search the web for real job listings
        const fcResponse = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${firecrawlKey}`,
          },
          body: JSON.stringify({
            query: `${searchQuery} hiring apply now site:linkedin.com OR site:indeed.com OR site:glassdoor.com OR site:wellfound.com`,
            limit: 10,
          }),
        })

        if (fcResponse.ok) {
          const fcData = await fcResponse.json()
          const results = fcData.data || []

          if (results.length > 0) {
            // Step 2: Use Groq to parse raw web data into structured job listings
            const webContent = results
              .map((r: any, i: number) => {
                const title = r.title || r.metadata?.title || ""
                const url = r.url || r.metadata?.sourceURL || ""
                const text = (r.markdown || r.content || r.extract || "").substring(0, 800)
                return `[Source ${i + 1}]\nTitle: ${title}\nURL: ${url}\nContent: ${text}`
              })
              .join("\n---\n")

            const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${groqKey}`,
              },
              body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                  {
                    role: "system",
                    content: `You are a job listing parser. Extract real job listings from the provided web search results.

Return ONLY valid JSON array. Each job must have:
- "job_title": the actual job title (string)
- "company": the company name (string)
- "location": the job location (string)
- "apply_link": the URL to apply (string)
- "source": the website source like "LinkedIn", "Indeed", etc. (string)

Rules:
- Only include REAL job postings, not articles or guides
- If you cannot find at least 2 real jobs, return an empty array []
- Do not invent or fabricate any listings
- Return ONLY the JSON array, no markdown, no explanation`
                  },
                  {
                    role: "user",
                    content: `Search query: "${searchQuery}"\n\nWeb results:\n${webContent}`
                  },
                ],
                temperature: 0.1,
                max_tokens: 2000,
              }),
            })

            if (groqRes.ok) {
              const groqData = await groqRes.json()
              const raw = groqData.choices?.[0]?.message?.content || "[]"
              const jobs = parseJSONArray(raw)

              if (jobs.length > 0) {
                return NextResponse.json({
                  jobs,
                  source: "firecrawl_groq",
                  note: `${jobs.length} real listings found via web intelligence.`,
                })
              }
            }
          }
        }
      } catch (fcErr) {
        console.error("Firecrawl+Groq pipeline error:", fcErr)
      }
    }

    // ── FALLBACK 1: JSearch via RapidAPI ──
    if (rapidApiKey && rapidApiKey !== "your_api_key_here") {
      try {
        const jsearchRes = await fetch(
          `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(searchQuery)}&num_pages=1`,
          {
            method: "GET",
            headers: {
              "X-RapidAPI-Key": rapidApiKey,
              "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
            },
          }
        )

        if (jsearchRes.ok) {
          const jsData = await jsearchRes.json()
          if (jsData.data && jsData.data.length > 0) {
            const jobs = jsData.data.map((job: any) => ({
              job_title: job.job_title,
              company: job.employer_name,
              location:
                `${job.job_city || ""}${job.job_city && job.job_country ? ", " : ""}${job.job_country || ""}` ||
                "Remote",
              apply_link: job.job_apply_link,
              source: "JSearch",
            }))
            return NextResponse.json({
              jobs,
              source: "jsearch",
              note: `${jobs.length} listings found via JSearch API.`,
            })
          }
        }
      } catch (jsErr) {
        console.error("JSearch fallback error:", jsErr)
      }
    }

    // ── FALLBACK 2: Remotive API (free, no key, remote jobs only) ──
    try {
      const remotiveRes = await fetch(
        `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(role)}&limit=10`
      )
      if (remotiveRes.ok) {
        const remotiveData = await remotiveRes.json()
        if (remotiveData.jobs && remotiveData.jobs.length > 0) {
          const jobs = remotiveData.jobs.map((job: any) => ({
            job_title: job.title,
            company: job.company_name,
            location: job.candidate_required_location || "Remote",
            apply_link: job.url,
            source: "Remotive",
          }))
          return NextResponse.json({
            jobs,
            source: "remotive",
            note: `${jobs.length} remote listings found via Remotive.`,
          })
        }
      }
    } catch (remErr) {
      console.error("Remotive fallback error:", remErr)
    }

    // ── No results from any source ──
    return NextResponse.json({
      jobs: [],
      source: "none",
      note: "No matching positions found. Try different keywords or broader criteria.",
    })

  } catch (error: any) {
    console.error("Job Search Route Error:", error)
    return NextResponse.json(
      { error: "Search engine encountered an error. Please try again." },
      { status: 500 }
    )
  }
}

function parseJSONArray(raw: string): any[] {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match) {
      try {
        const parsed = JSON.parse(match[1])
        return Array.isArray(parsed) ? parsed : []
      } catch {}
    }
    const start = raw.indexOf("[")
    const end = raw.lastIndexOf("]")
    if (start !== -1 && end !== -1) {
      try {
        const parsed = JSON.parse(raw.substring(start, end + 1))
        return Array.isArray(parsed) ? parsed : []
      } catch {}
    }
    return []
  }
}

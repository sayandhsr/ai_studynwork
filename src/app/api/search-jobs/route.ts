import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { role, location, experience } = await req.json()

    if (!role || role.trim().length < 2) {
      return NextResponse.json({ error: "Please enter a valid job title." }, { status: 400 })
    }

    const firecrawlKey = process.env.FIRECRAWL_API_KEY
    const geminiKey = process.env.GEMINI_API_KEY
    const rapidApiKey = process.env.RAPIDAPI_KEY

    const searchQuery = `${role} jobs ${location || "remote"} ${experience || ""}`.trim()

    // ── PRIMARY: Firecrawl + Gemini pipeline for real, high-quality job data ──
    if (firecrawlKey && geminiKey) {
      try {
        // Step 1: Search the web for real job listings
        const fcResponse = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${firecrawlKey}`,
          },
          body: JSON.stringify({
            query: `${searchQuery} hiring apply now site:linkedin.com OR site:indeed.com OR site:internshala.com OR site:glassdoor.com OR site:wellfound.com`,
            limit: 8,
          }),
        })

        if (fcResponse.ok) {
          const fcData = await fcResponse.json()
          const results = fcData.data || []

          if (results.length > 0) {
            // Step 2: Use Gemini to parse raw web data into structured job listings
            const webContent = results
              .map((r: any, i: number) => {
                const title = r.title || r.metadata?.title || ""
                const url = r.url || r.metadata?.sourceURL || ""
                // Increase character limit to 5000 to ensure we capture the apply link and context
                const text = (r.markdown || r.content || r.extract || "").substring(0, 5000)
                return `[Source ${i + 1}]\nTitle: ${title}\nURL: ${url}\nContent: ${text}`
              })
              .join("\n---\n")

            const systemPrompt = `You are an elite job discovery engine. Extract REAL, current job listings from the provided web data.
            
            Return ONLY a valid JSON array. Each object MUST have:
            - "job_title": Full official job title
            - "company": Company name
            - "location": Location or "Remote"
            - "apply_link": The most direct URL to the job opening
            - "source": Platform name (LinkedIn, Internshala, Indeed, etc.)

            Rules:
            1. ONLY include actual job postings. Skip articles or general sites.
            2. For Internshala, prioritize results that look like 'internshala.com/job/detail/'.
            3. Accuracy is critical. If a link doesn't look like a job detail page, skip it.
            4. Return ONLY the JSON array, no markdown wrappers.`

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`
            const geminiRes = await fetch(geminiUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ 
                  role: "user", 
                  parts: [{ text: `${systemPrompt}\n\nSearch Query: ${searchQuery}\n\nWeb Data:\n${webContent}` }] 
                }],
                generationConfig: {
                    temperature: 0.1,
                    topP: 0.95,
                    maxOutputTokens: 4096,
                }
              })
            })

            if (geminiRes.ok) {
              const geminiData = await geminiRes.json()
              const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "[]"
              const cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim()
              const jobs = parseJSONArray(cleanText)

              if (jobs.length > 0) {
                return NextResponse.json({
                  jobs,
                  source: "firecrawl_gemini",
                  note: `${jobs.length} tactical opportunities discovered via Intelligence Engine.`,
                })
              }
            }
          }
        }
      } catch (fcErr) {
        console.error("Firecrawl+Gemini pipeline error:", fcErr)
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

    // ── GUARANTEED FALLBACK: Always show something ──
    const fallbackJobs = [
      { job_title: `${role} - Remote`, company: "Open Position", location: location || "Remote", apply_link: `https://www.google.com/search?q=${encodeURIComponent(searchQuery + " jobs apply")}`, source: "Suggested" },
      { job_title: `Senior ${role}`, company: "Multiple Companies", location: location || "Remote", apply_link: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(role)}`, source: "LinkedIn Search" },
      { job_title: `${role} Specialist`, company: "Various Employers", location: "Remote / Hybrid", apply_link: `https://www.indeed.com/jobs?q=${encodeURIComponent(role)}&l=${encodeURIComponent(location || "")}`, source: "Indeed Search" },
      { job_title: `${role} Graduate/Intern`, company: "Targeted Platforms", location: location || "India / Remote", apply_link: `https://internshala.com/jobs/keywords-${encodeURIComponent(role.toLowerCase().replace(/\s+/g, "%20"))}`, source: "Internshala Search" },
    ]

    return NextResponse.json({
      jobs: fallbackJobs,
      source: "fallback",
      note: "Showing curated search links. Click apply to find live listings on job boards.",
    })

  } catch (error: any) {
    console.error("Job Search Route Error:", error)
    return NextResponse.json({
      jobs: [
        { job_title: "Software Engineer", company: "Search on Google", location: "Remote", apply_link: "https://www.google.com/search?q=software+engineer+jobs", source: "Google" },
      ],
      source: "error_fallback",
      note: "Search temporarily limited. Here's a direct search link.",
    })
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

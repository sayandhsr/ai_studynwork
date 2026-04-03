import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { query, depth = "basic" } = await req.json()

    if (!query || query.trim().length < 3) {
      return NextResponse.json({ error: "Query must be at least 3 characters." }, { status: 400 })
    }

    const firecrawlKey = process.env.FIRECRAWL_API_KEY
    const groqKey = process.env.GROQ_API_KEY
    const openrouterKey = process.env.OPENROUTER_API_KEY

    // STEP 1: Fetch web content via Firecrawl search
    let webContent = ""
    let sources: { title: string; url: string }[] = []

    if (firecrawlKey) {
      try {
        const fcResponse = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${firecrawlKey}`,
          },
          body: JSON.stringify({
            query: query,
            limit: depth === "advanced" ? 8 : 4,
          }),
        })

        if (fcResponse.ok) {
          const fcData = await fcResponse.json()
          const results = fcData.data || []

          sources = results.map((r: any) => ({
            title: r.title || r.metadata?.title || "Untitled Source",
            url: r.url || r.metadata?.sourceURL || "#",
          }))

          webContent = results
            .map((r: any, i: number) => {
              const title = r.title || r.metadata?.title || `Source ${i + 1}`
              const text = r.markdown || r.content || r.extract || ""
              return `### Source ${i + 1}: ${title}\n${text.substring(0, 1500)}`
            })
            .join("\n\n---\n\n")
        } else {
          console.error("Firecrawl error:", fcResponse.status)
        }
      } catch (fcErr) {
        console.error("Firecrawl fetch failed:", fcErr)
      }
    }

    // STEP 2: Build the LLM prompt
    const systemPrompt = `You are a senior research analyst. Produce a structured research report in valid JSON format.

Your response must be ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "summary": "A concise 3-5 sentence executive summary",
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3", "Insight 4", "Insight 5"],
  "detailedExplanation": "A thorough 2-4 paragraph explanation covering the most important aspects",
  "takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"]
}`

    const userPrompt = webContent
      ? `Research query: "${query}"\n\nDepth: ${depth}\n\nAnalyze the following web sources and generate a comprehensive research report:\n\n${webContent}`
      : `Research query: "${query}"\n\nDepth: ${depth}\n\nGenerate a comprehensive research report based on your knowledge. Note: No live web sources were available, so use your training data.`

    // STEP 3: Call Groq (primary) or OpenRouter (fallback)
    let result = null

    if (groqKey) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 3000,
          }),
        })

        if (groqRes.ok) {
          const groqData = await groqRes.json()
          const raw = groqData.choices?.[0]?.message?.content || ""
          result = parseJSON(raw)
        }
      } catch (groqErr) {
        console.error("Groq error:", groqErr)
      }
    }

    // Fallback to OpenRouter
    if (!result && openrouterKey) {
      try {
        const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openrouterKey}`,
          },
          body: JSON.stringify({
            model: "meta-llama/llama-3.3-70b-instruct",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 3000,
          }),
        })

        if (orRes.ok) {
          const orData = await orRes.json()
          const raw = orData.choices?.[0]?.message?.content || ""
          result = parseJSON(raw)
        }
      } catch (orErr) {
        console.error("OpenRouter error:", orErr)
      }
    }

    if (!result) {
      return NextResponse.json({ error: "Research synthesis failed. All AI providers are currently unavailable." }, { status: 503 })
    }

    return NextResponse.json({
      ...result,
      sources,
      query,
      depth,
      timestamp: new Date().toISOString(),
    })

  } catch (error: any) {
    console.error("Deep Research Route Error:", error)
    return NextResponse.json({ error: "Research engine encountered an internal error." }, { status: 500 })
  }
}

function parseJSON(raw: string): any {
  try {
    // Try direct parse
    return JSON.parse(raw)
  } catch {
    // Try extracting JSON from markdown code fences
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (match) {
      try { return JSON.parse(match[1]) } catch {}
    }
    // Try finding first { to last }
    const start = raw.indexOf("{")
    const end = raw.lastIndexOf("}")
    if (start !== -1 && end !== -1) {
      try { return JSON.parse(raw.substring(start, end + 1)) } catch {}
    }
    return null
  }
}

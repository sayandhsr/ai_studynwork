import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { data, targetRole } = await req.json()
    const orKey = process.env.OPENROUTER_API_KEY

    const prompt = `You are an expert ATS (Applicant Tracking System) optimizer. 
Your goal is to rewrite the provided resume data to be highly discoverable by ATS while remaining professional and human-readable.

Original Data:
${JSON.stringify(data, null, 2)}

Target Role: ${targetRole || "Software Engineer / Professional"} (optimize for this)

Instructions:
1. Enhance the 'summary' to be impactful and keyword-rich.
2. Rewrite 'experience' bullet points to use the STAR method (Situation, Task, Action, Result) where possible.
3. Incorporate industry-standard keywords related to ${targetRole}.
4. Ensure the formatting of the output remains EXACTLY the same JSON structure as the input.

Return ONLY the optimized JSON, no conversational text.`

    const geminiKey = process.env.GEMINI_API_KEY
    let optimizedData = null
    let aiError = ""

    // 1. Try Native Gemini API first (Free & Fast)
    if (geminiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
          })
        })

        if (res.ok) {
          const aiData = await res.json()
          const text = aiData.candidates?.[0]?.content?.parts?.[0]?.text || ""
          const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim()
          optimizedData = JSON.parse(jsonStr)
        } else {
          aiError = await res.text()
          console.error("Native Gemini API Error:", aiError)
        }
      } catch (e: any) {
        console.error("Native Gemini Exception:", e)
      }
    }

    // 2. Fallback to OpenRouter if Gemini fails or key is missing
    if (!optimizedData && orKey) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${orKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-lite-preview-02-05:free",
          messages: [{ role: "user", content: prompt }]
        })
      })

      if (!res.ok) {
         throw new Error(`OpenRouter Optimization failed: ${await res.text()}`)
      }

      const aiData = await res.json()
      const text = aiData.choices?.[0]?.message?.content || ""
      
      // Clean JSON from markdown if exists
      const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim()
      optimizedData = JSON.parse(jsonStr)
    }

    if (!optimizedData) {
      throw new Error("All AI Optimization models failed.")
    }

    return NextResponse.json({ optimizedData })

  } catch (error) {
    console.error("Layout Optimization Error:", error)
    return NextResponse.json({ error: "Failed to optimize resume." }, { status: 500 })
  }
}

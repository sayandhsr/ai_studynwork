import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()
    const orKey = process.env.OPENROUTER_API_KEY || ""
    const geminiKey = process.env.GEMINI_API_KEY || ""
    const groqKey = process.env.GROQ_API_KEY || ""

    let optimizedData = null
    let geminiResults = ""
    let groqResults = ""

    // 1. Try Groq (Fastest)
    if (groqKey) {
      try {
        console.log(`[OPT] Trying Groq: llama-3.3-70b-versatile`)
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt + "\n\nReturn ONLY the raw JSON object. No markdown, no explanation." }],
            response_format: { type: "json_object" }
          }),
          signal: AbortSignal.timeout(20000)
        })

        if (res.ok) {
          const aiData = await res.json()
          const text = aiData.choices?.[0]?.message?.content || ""
          optimizedData = JSON.parse(text)
          console.log(`[OPT] Groq Success!`)
        } else {
          console.error(`[OPT] Groq Error:`, await res.text())
          groqResults = `Groq: Error ${res.status}. `
        }
      } catch (e: any) {
        console.error(`[OPT] Groq Exception:`, e.message)
        groqResults = `Groq: ${e.message}. `
      }
    }

    // 2. Try Native Gemini API (Failover)
    if (!optimizedData && geminiKey) {
      const geminiAttempts = [
        { model: "gemini-2.0-flash", version: "v1beta" },
        { model: "gemini-1.5-flash", version: "v1" }
      ]
      for (const attempt of geminiAttempts) {
        try {
          console.log(`[OPT] Trying Gemini: ${attempt.model}`)
          const url = `https://generativelanguage.googleapis.com/${attempt.version}/models/${attempt.model}:generateContent?key=${geminiKey}`
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }]
            }),
            signal: AbortSignal.timeout(20000)
          })

          if (res.ok) {
            const aiData = await res.json()
            const text = aiData.candidates?.[0]?.content?.parts?.[0]?.text || ""
            const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim()
            optimizedData = JSON.parse(jsonStr)
            console.log(`[OPT] Gemini Success with ${attempt.model}`)
            break
          } else {
            console.error(`[OPT] Gemini ${attempt.model} Error:`, await res.text())
            geminiResults += `${attempt.model}: Error ${res.status}. `
          }
        } catch (e: any) {
          console.error(`[OPT] Gemini ${attempt.model} Exception:`, e.message)
          geminiResults += `${attempt.model}: ${e.message}. `
        }
      }
    }

    // 3. Fallback to OpenRouter (Final)
    let orResults = ""
    if (!optimizedData && orKey) {
      const orModels = [
        "google/gemini-2.0-flash-lite-preview-02-05:free",
        "mistralai/mistral-7b-instruct:free"
      ];
      for (const model of orModels) {
        try {
          console.log(`[OPT] Trying OpenRouter: ${model}`)
          const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { 
              "Authorization": `Bearer ${orKey}`, 
              "Content-Type": "application/json",
              "HTTP-Referer": "https://ai-studynwork.vercel.app",
              "X-Title": "Study Nest Sanctuary"
            },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: prompt }]
            }),
            signal: AbortSignal.timeout(25000)
          });

          if (res.ok) {
            const aiData = await res.json();
            const text = (aiData.choices?.[0]?.message?.content || "").replace(/[*#`]/g, "").trim();
            const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim()
            optimizedData = JSON.parse(jsonStr)
            console.log(`[OPT] OpenRouter Success with ${model}`)
            break
          } else {
            console.error(`[OPT] OR Error (${model}):`, await res.text());
            orResults += `${model}: Error ${res.status}. `
          }
        } catch (e: any) {
          console.error(`[OPT] OR Exception (${model}):`, e.message);
          orResults += `${model}: ${e.message}. `
        }
      }
    }

    if (!optimizedData) {
      throw new Error(`Optimization Failed Details: (Groq: ${groqResults}) (Gemini: ${geminiResults}) (OR: ${orResults})`)
    }

    return NextResponse.json({ optimizedData })

  } catch (error: any) {
    console.error("Resume Optimization Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

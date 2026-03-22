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
    let geminiResults = ""

    // 1. Try Native Gemini API first (Free & Fast)
    if (geminiKey) {
      const geminiAttempts = [
        { model: "gemini-2.0-flash", version: "v1beta" },
        { model: "gemini-1.5-flash", version: "v1" },
        { model: "gemini-1.5-flash", version: "v1beta" }
      ]
      for (const attempt of geminiAttempts) {
        try {
          console.log(`[OPT] Trying Gemini: ${attempt.model} (${attempt.version})`)
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
            break // Success!
          } else {
            aiError = await res.text()
            console.error(`[OPT] Gemini ${attempt.model} Error (Status ${res.status}):`, aiError)
            geminiResults += `${attempt.model}: Error ${res.status}. `
          }
        } catch (e: any) {
          console.error(`[OPT] Gemini ${attempt.model} Exception:`, e.message)
          geminiResults += `${attempt.model}: ${e.message}. `
        }
      }
    } else {
      geminiResults = "Key is MISSING in Vercel settings. "
    }

    // 2. Fallback to OpenRouter if Gemini fails or key is missing
    let orResults = ""
    if (!optimizedData && orKey) {
      const orModels = [
        "google/gemini-2.0-flash-lite-preview-02-05:free",
        "google/gemini-flash-1.5-exp:free",
        "mistralai/mistral-7b-instruct:free",
        "openchat/openchat-7b:free"
      ];
      for (const model of orModels) {
        try {
          console.log(`[OPT] Trying OpenRouter: ${model}`)
          const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${orKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: prompt }]
            }),
            signal: AbortSignal.timeout(30000)
          });

          if (res.ok) {
            const aiData = await res.json();
            const text = (aiData.choices?.[0]?.message?.content || "").replace(/[*#`]/g, "").trim();
            const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim()
            optimizedData = JSON.parse(jsonStr)
            console.log(`[OPT] OpenRouter Success with ${model}`)
            break
          } else {
            const errText = await res.text()
            console.error(`[OPT] OR Error (${model}):`, errText);
            orResults += `${model}: Error ${res.status}. `
          }
        } catch (e: any) {
          console.error(`[OPT] OR Exception (${model}):`, e.message);
          orResults += `${model}: ${e.message}. `
        }
      }
    } else if (!optimizedData) {
      orResults = "Key is MISSING in Vercel settings. "
    }

    if (!optimizedData) {
      throw new Error(`Optimization Failed Details: (Gemini: ${geminiResults}) (OpenRouter: ${orResults})`)
    }

    return NextResponse.json({ optimizedData })

  } catch (error) {
    console.error("Layout Optimization Error:", error)
    return NextResponse.json({ error: "Failed to optimize resume." }, { status: 500 })
  }
}

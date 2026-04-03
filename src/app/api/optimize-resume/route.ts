import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { data, targetRole } = await req.json()
    const orKey = process.env.OPENROUTER_API_KEY || ""
    const geminiKey = process.env.GEMINI_API_KEY || ""

    const systemPrompt = `You are "Spurce Sanctuary AI", an elite career architect and resume psychologist. 
    Your goal is to transform a standard resume into a high-impact, ATS-optimized document for the role of: ${targetRole}.
    
    CRITICAL REQUIREMENTS:
    1. STAR METHOD: Rewrite every experience bullet point using the STAR method (Situation, Task, Action, Result). Focus on quantifiable results (e.g., "Increased revenue by 20%", "Reduced latency by 45ms").
    2. KEYWORD INJECTION: Naturally weave in high-density industry keywords relevant to ${targetRole}.
    3. TONE: Maintain an elite, professional, and slightly intellectual tone (the "Spurce" aesthetic). Use sophisticated verbs (e.g., "Orchestrated", "Catalyzed", "Architected").
    4. STRUCTURE: Retain the exact JSON structure provided.
    
    Return ONLY a valid JSON object matching the input structure. Do not include markdown blocks or any conversational text.`

    const userPrompt = `Input Data: ${JSON.stringify(data)}`

    let optimizedData = null

    // Attempt with Gemini 2.0 Flash via OpenRouter (Elite choice)
    if (orKey) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${orKey}`, 
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ai-studynwork.vercel.app",
            "X-Title": "Spurce Sanctuary"
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-001",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }
          }),
          signal: AbortSignal.timeout(45000)
        });

        if (res.ok) {
          const aiData = await res.json();
          const text = aiData.choices?.[0]?.message?.content || "";
          optimizedData = JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
        }
      } catch (e) {}
    }

    // Native Fallback
    if (!optimizedData && geminiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ 
              role: "user", 
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] 
            }]
          }),
          signal: AbortSignal.timeout(30000)
        })

        if (res.ok) {
          const aiData = await res.json()
          const text = aiData.candidates?.[0]?.content?.parts?.[0]?.text || ""
          const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim()
          optimizedData = JSON.parse(jsonStr)
        }
      } catch (e) {}
    }

    if (!optimizedData) {
      throw new Error("The analytical engine failed to resolve the optimization path.")
    }

    return NextResponse.json({ optimizedData })

  } catch (error: any) {
    console.error("Resume Optimization Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

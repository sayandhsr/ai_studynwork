import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const geminiKey = process.env.GEMINI_API_KEY
    const openRouterKey = process.env.OPENROUTER_API_KEY

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 })
    }

    // --- PROMPT PREPARATION ---
    // Gemini expects: [{"role": "user", "parts": [{"text": "Hello"}]}, {"role": "model", "parts": [{"text": "Hi!"}]}]
    const geminiMessages = []
    let hasUser = false
    
    // Always start with system prompt equivalent in Gemini formats
    geminiMessages.push({
      role: "user",
      parts: [{ text: "System Instructions: You are a premium AI Assistant like ChatGPT and Notion AI. Be professional, format text clearly with markdown headings/bullets, and assist with document summarization. Follow previous instructions strictly." }]
    })
    geminiMessages.push({ role: "model", parts: [{ text: "Understood. I'm ready to assist." }] })

    messages.forEach((msg: any) => {
      let role = msg.role === "user" ? "user" : "model"
      if (role === "user") hasUser = true
      // Only keep sequential roles if required by API, but Gemini strictly enforces it usually. 
      // To simplify, we map them directly. If user sends consecutive users, Gemini API might reject it. 
      // Assuming array is standard user->model->user
      if (hasUser) {
        geminiMessages.push({
          role,
          parts: [{ text: msg.content || " " }]
        })
      }
    })

    // If no real user message, exit
    if (!hasUser) {
       return NextResponse.json({ error: "Missing user prompt" }, { status: 400 })
    }

    let aiResponseText = null
    let lastError = ""

    // --- STRATEGY 1: NATIVE GEMINI API ---
    if (geminiKey) {
      try {
        console.log("[Assistant] Attempting Native Gemini API (gemini-1.5-flash-latest)")
        const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`
        
        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: geminiMessages }),
          signal: AbortSignal.timeout(15000)
        })

        if (res.ok) {
          const data = await res.json()
          // Strict user-requested parsing:
          if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
             aiResponseText = data.candidates[0].content.parts[0].text
             console.log("[Assistant] Gemini Native API succeeded!")
          } else {
             throw new Error("Gemini returned success but structure was unexpected.")
          }
        } else {
          const errText = await res.text()
          throw new Error(`Gemini status ${res.status}: ${errText}`)
        }
      } catch (err: any) {
        console.error("[Assistant] Gemini Failed:", err.message)
        lastError = err.message
      }
    } else {
      console.log("[Assistant] Skipping Gemini Native: GEMINI_API_KEY not found in env.")
      lastError = "GEMINI_API_KEY missing"
    }

    // --- STRATEGY 2: OPENROUTER FAILSAFE ---
    if (!aiResponseText && openRouterKey) {
      console.log("[Assistant] Engaging Fallback: OpenRouter Models")
      
      const openRouterMessages = [
        { role: "system", content: "You are a premium AI Assistant like ChatGPT and Notion AI. Be professional, format text clearly with markdown headings/bullets, and assist with document summarization." }
      ]
      
      messages.forEach((msg: any) => {
        if (msg.role === "user" || msg.role === "assistant") {
          openRouterMessages.push({ role: msg.role.toLowerCase(), content: msg.content })
        }
      })

      const orModels = [
        "x-ai/grok-2-latest",
        "deepseek/deepseek-chat",
        "google/gemini-2.0-flash-lite-preview-02-05:free",
        "mistralai/mistral-7b-instruct:free"
      ]

      for (const model of orModels) {
        try {
          console.log(`[Assistant Fallback] Attempting: ${model}`)
          const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openRouterKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://ai-productivity-hub.vercel.app",
              "X-Title": "Premium AI Assistant"
            },
            body: JSON.stringify({
              model: model,
              messages: openRouterMessages
            }),
            signal: AbortSignal.timeout(15000)
          })

          if (res.ok) {
            const data = await res.json()
            if (data?.choices?.[0]?.message?.content) {
              aiResponseText = data.choices[0].message.content
              console.log(`[Assistant Fallback] Success on ${model}!`)
              break
            }
          } else {
            console.log(`[Assistant Fallback] ${model} failed: ${res.status}`)
          }
        } catch (e) {
           console.log(`[Assistant Fallback] ${model} network error.`)
        }
      }
    }

    // --- OUTPUT ---
    if (aiResponseText) {
      return NextResponse.json({ content: aiResponseText })
    } else {
      // 0% Fake Responses Policy: Throw UI-readable error if all fail
      throw new Error("AI service temporarily unavailable")
    }

  } catch (error: any) {
    console.error("AI Assistant Global Error:", error)
    return NextResponse.json({ error: error.message || "AI service temporarily unavailable" }, { status: 503 })
  }
}

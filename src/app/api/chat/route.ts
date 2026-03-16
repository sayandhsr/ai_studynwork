import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const apiKey = process.env.OPENROUTER_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "AI Assistant not configured" }, { status: 500 })
    }

    const models = [
      "google/gemini-flash-1.5:free",
      "google/gemini-2.0-flash-exp:free",
      "meta-llama/llama-3.1-8b-instruct:free",
      "deepseek/deepseek-chat"
    ]

    let aiResponse = null
    let lastError = ""

    for (const model of models) {
      try {
        console.log(`[Assistant] Attempting with model: ${model}`)
        
        const chatMessages = [
          { role: "system", content: "You are a helpful assistant for an AI Productivity Hub. You help users with YouTube summaries, resume building, and taking notes. Be concise and friendly." }
        ]

        // CRITICAL: Sequence must be System -> User -> Assistant -> User ...
        // We skip any leading assistant messages from the history
        let hasFirstUser = false
        messages.forEach((msg: any) => {
          if (msg.role === "user") hasFirstUser = true
          if (hasFirstUser && (msg.role === "user" || msg.role === "assistant")) {
            chatMessages.push({ role: msg.role.toLowerCase(), content: msg.content })
          }
        })

        // If for some reason we still have no messages, don't waste an API call
        if (chatMessages.length === 1) {
            console.error("[Assistant] No user messages found to send")
            continue
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ai-productivity-hub.vercel.app",
            "X-Title": "AI Productivity Hub"
          },
          body: JSON.stringify({
            model: model,
            messages: chatMessages
          }),
          signal: AbortSignal.timeout(15000)
        })

        if (response.ok) {
          const data = await response.json()
          if (data.choices?.[0]?.message?.content) {
            aiResponse = data
            console.log(`[Assistant] ${model} success!`)
            break
          }
        } else {
          const errorText = await response.text()
          console.error(`[Assistant] ${model} error (${response.status}):`, errorText)
          lastError = `Status ${response.status}: ${errorText}`
        }
      } catch (err: any) {
        lastError = err.message
        console.error(`[Assistant] ${model} catch: ${err.message}`)
      }
    }

    if (!aiResponse) {
      throw new Error(`All AI models failed. Last error: ${lastError}`)
    }

    return NextResponse.json(aiResponse)
  } catch (error: any) {
    console.error("AI Assistant Error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

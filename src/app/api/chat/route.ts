import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const apiKey = process.env.OPENROUTER_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "AI Assistant not configured" }, { status: 500 })
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
        model: "google/gemini-flash-1.5:free",
        messages: [
          { role: "system", content: "You are a helpful assistant for an AI Productivity Hub. You help users with YouTube summaries, resume building, and taking notes. Be concise and friendly." },
          ...messages
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || "Failed to connect to OpenRouter")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("AI Assistant Error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

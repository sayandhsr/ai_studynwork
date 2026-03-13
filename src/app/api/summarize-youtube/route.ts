import { NextResponse } from "next/server"
import { execSync } from "child_process"
import { createClient } from "@/lib/supabase/server"

// A very basic YouTube ID extractor
function extractVideoId(url: string) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length == 11) ? match[7] : false;
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    const videoId = extractVideoId(url)
    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // --- ROBUST TRANSCRIPT FETCHING (PYTHON BRIDGE) ---
    let transcriptText = ""
    console.log(`[YT API] Starting Python fetch for: ${videoId}`)

    try {
      // Use python -m youtube_transcript_api to avoid PATH issues
      // The --format text option gives us clean concatenated text
      const command = `python -m youtube_transcript_api ${videoId} --format text`
      const output = execSync(command, { encoding: 'utf8' })
      
      transcriptText = output.trim()
      
      if (transcriptText.length > 50) {
        console.log(`[YT API] Python success! Fetched ${transcriptText.length} chars.`)
      }
    } catch (err: any) {
      console.error("[YT API] Python bridge failed:", err.message)
    }

    // Check if we ultimately got something
    if (!transcriptText || transcriptText.length < 50) {
      return NextResponse.json({ 
        error: "Failed to extract transcript. Please ensure subtitles/captions are available on YouTube for this video." 
      }, { status: 400 });
    }

    console.log(`[YT API] Final Transcript Length: ${transcriptText.length} characters`);

    const openRouterApiKey = process.env.OPENROUTER_API_KEY
    if (!openRouterApiKey) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 })
    }

    // Call OpenRouter with fallback logic (Prioritizing DeepSeek as requested)
    const models = [
      "deepseek/deepseek-chat", 
      "google/gemini-flash-1.5:free", 
      "meta-llama/llama-3.1-8b-instruct:free",
      "x-ai/grok-beta"
    ]
    let summary = ""
    let lastError = ""

    for (const model of models) {
      try {
        console.log(`[YT API] Attempting summary with model: ${model}`);
        const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model, 
            messages: [
              { role: "system", content: "You are an expert content summarizer. Provide a concise summary, key points, and bulleted highlights of the given YouTube transcript. Format the output professionally using Markdown." },
              { role: "user", content: `Please summarize this transcript (or video content):\n\n${transcriptText}` }
            ]
          }),
          signal: AbortSignal.timeout(60000) // 1 minute timeout
        })

        if (!openRouterRes.ok) {
          const errBody = await openRouterRes.text()
          console.warn(`Model ${model} failed (${openRouterRes.status}):`, errBody)
          lastError = `Model ${model} error: ${openRouterRes.status}`
          continue 
        }

        const data = await openRouterRes.json()
        if (data.choices && data.choices.length > 0) {
          summary = data.choices[0].message.content
          break 
        }
      } catch (err: any) {
        console.warn(`Request for ${model} failed:`, err.message)
        lastError = err.message
      }
    }

    if (!summary) {
      throw new Error(`AI Providers failed to generate summary. Last error: ${lastError}`)
    }

    // Save to database
    const { error: dbError } = await supabase
      .from("yt_summaries")
      .insert([
        { 
          user_id: user.id, 
          video_url: url, 
          summary: summary 
        }
      ])

    if (dbError) {
      console.error("Database Save Error:", dbError)
      // We still return the summary even if save fails
    }

    return NextResponse.json({ summary })
    
  } catch (error: any) {
    console.error("Summary API Error:", error)
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 })
  }
}


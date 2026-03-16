import { NextResponse } from "next/server"
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

    // --- ROBUST TRANSCRIPT FETCHING (RAPIDAPI) ---
    let transcriptText = ""
    const rapidApiKey = process.env.RAPIDAPI_KEY;

    if (!rapidApiKey) {
      return NextResponse.json({ error: "RapidAPI Key not configured" }, { status: 500 });
    }

    try {
      console.log(`[YT API] Fetching transcript via RapidAPI for: ${videoId}`);
      const rapidApiRes = await fetch(`https://youtube-transcript3.p.rapidapi.com/api/transcript-with-timestamps?video_id=${videoId}`, {
        method: "GET",
        headers: {
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "youtube-transcript3.p.rapidapi.com"
        }
      });

      if (rapidApiRes.ok) {
        const rapidData = await rapidApiRes.json();
        // The API returns an array of segments: { text: "...", start: 0, duration: 0 }
        if (rapidData.transcript && Array.isArray(rapidData.transcript)) {
          transcriptText = rapidData.transcript.map((s: any) => s.text).join(" ");
          console.log(`[YT API] RapidAPI success! Fetched ${transcriptText.length} chars.`);
        }
      } else {
        const errText = await rapidApiRes.text();
        console.error(`[YT API] RapidAPI Error (${rapidApiRes.status}):`, errText);
      }
    } catch (err: any) {
      console.error("[YT API] RapidAPI connection error:", err.message);
    }

    // --- ROBUST FALLBACK (FIRECRAWL DEEP SCRAPE) ---
    if (!transcriptText || transcriptText.length < 50) {
      const firecrawlKey = process.env.FIRECRAWL_API_KEY;
      if (firecrawlKey) {
        console.log(`[YT API] Transcript unavailable. Deep-scraping via Firecrawl for: ${videoId}`);
        try {
          const firecrawlRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${firecrawlKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              url: `https://www.youtube.com/watch?v=${videoId}`,
              formats: ["markdown", "metadata"]
            })
          });

          if (firecrawlRes.ok) {
            const fcData = await firecrawlRes.json();
            if (fcData.success && fcData.data) {
              const content = fcData.data.markdown || "";
              const title = fcData.data.metadata?.title || "Unknown Video";
              const description = fcData.data.metadata?.description || "";
              
              transcriptText = `DEEP SCRAPE CONTEXT (TRANSCRIPT UNAVAILABLE):\nTitle: ${title}\nDescription: ${description}\n\nPage Content:\n${content.substring(0, 5000)}`; // Caps at 5k to prevent token bloat
              console.log(`[YT API] Firecrawl success! Fetched ${transcriptText.length} chars.`);
            }
          } else {
            console.error(`[YT API] Firecrawl Error (${firecrawlRes.status})`);
          }
        } catch (fcErr: any) {
          console.error("[YT API] Firecrawl connection failed:", fcErr.message);
        }
      }
    }

    // Final sanity check
    if (!transcriptText || transcriptText.length < 20) {
      return NextResponse.json({ 
        error: "Failed to extract video information. Even the deep-scrape was unsuccessful. Please check if the video is private or restricted." 
      }, { status: 400 });
    }

    console.log(`[YT API] Content ready for AI processing. Length: ${transcriptText.length} characters`);

    const openRouterApiKey = process.env.OPENROUTER_API_KEY
    if (!openRouterApiKey) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 })
    }

    // Call OpenRouter with fallback logic (Prioritizing Grok as requested)
    const models = [
      "x-ai/grok-beta",
      "deepseek/deepseek-chat", 
      "google/gemini-flash-1.5:free", 
      "meta-llama/llama-3.1-8b-instruct:free"
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
              { 
                role: "system", 
                content: `You are an expert content analyzer and educator. 
                Your goal is to provide a deep, readable, and context-rich study of the provided content.
                - If the content is a transcript: Extract the core arguments, step-by-step logic, and key wisdom.
                - If the content is from a page scrape (No Transcript): Analyze the Title, Description, and available page text to reconstruct the video's likely message and value. Start by saying "Summary based on video context and metadata."
                Format professionally using Markdown. Use bold headers, bullet points, and a 'Core Insights' section.` 
              },
              { role: "user", content: `Please provide a detailed study of this content:\n\n${transcriptText}` }
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


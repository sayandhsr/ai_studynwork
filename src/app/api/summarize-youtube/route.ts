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
    const { url, manualTranscript } = await req.json()

    if (!url && !manualTranscript) {
      return NextResponse.json({ error: "URL or transcript is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    let transcriptText = manualTranscript || ""
    const videoId = url ? extractVideoId(url) : null

    // --- AUTOMATIC FETCHING (ONLY IF NO MANUAL TRANSCRIPT) ---
    if (!transcriptText && videoId) {
      const rapidApiKey = process.env.RAPIDAPI_KEY;
      if (rapidApiKey) {
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
            if (rapidData.transcript && Array.isArray(rapidData.transcript)) {
              transcriptText = rapidData.transcript.map((s: any) => s.text).join(" ");
              console.log(`[YT API] RapidAPI success! Fetched ${transcriptText.length} chars.`);
            }
          }
        } catch (err: any) {
          console.error("[YT API] RapidAPI connection error:", err.message);
        }
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
                
                transcriptText = `DEEP SCRAPE CONTEXT (TRANSCRIPT UNAVAILABLE):\nTitle: ${title}\nDescription: ${description}\n\nPage Content:\n${content.substring(0, 5000)}`;
                console.log(`[YT API] Firecrawl success! Fetched ${transcriptText.length} chars.`);
              }
            }
          } catch (fcErr: any) {
            console.error("[YT API] Firecrawl connection failed:", fcErr.message);
          }
        }
      }
    }

    // Final check for content
    if (!transcriptText || transcriptText.length < 20) {
      return NextResponse.json({ 
        error: "We couldn't fetch the video content automatically (it might be private or restricted). Please use 'Manual Mode' and paste the transcript or description for a better summary." 
      }, { status: 400 });
    }

    console.log(`[YT API] Content ready for AI processing. Length: ${transcriptText.length} characters`);

    const openRouterApiKey = process.env.OPENROUTER_API_KEY
    if (!openRouterApiKey) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 })
    }

    // Call OpenRouter
    const models = [
      "x-ai/grok-beta",
      "deepseek/deepseek-chat", 
      "google/gemini-flash-1.5:free"
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
                - If the content is from a page scrape or manual text: Analyze the provided information to provide a deep study. If it's metadata, note it in the first sentence.
                Format professionally using Markdown. Use bold headers, bullet points, and a 'Core Insights' section.` 
              },
              { role: "user", content: `Please provide a detailed study of this content:\n\n${transcriptText}` }
            ]
          }),
          signal: AbortSignal.timeout(60000)
        })

        if (openRouterRes.ok) {
          const data = await openRouterRes.json()
          if (data.choices && data.choices.length > 0) {
            summary = data.choices[0].message.content
            break 
          }
        }
      } catch (err: any) {
        lastError = err.message
      }
    }

    if (!summary) {
      throw new Error(`AI Providers failed to generate summary. ${lastError}`)
    }

    // Save to database
    const { error: dbError } = await supabase
      .from("yt_summaries")
      .insert([
        { 
          user_id: user.id, 
          video_url: url || "Manual Entry", 
          summary: summary 
        }
      ])

    if (dbError) {
      console.error("Database Save Error:", dbError)
    }

    return NextResponse.json({ summary })
    
  } catch (error: any) {
    console.error("Summary API Error:", error)
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 })
  }
}


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
      let metadataInfo = "";

      if (rapidApiKey) {
        // Fallback 1: youtube-transcript3
        try {
          console.log(`[YT API] Attempt 1: Fetching transcript via youtube-transcript3 for: ${videoId}`);
          const rapidApiRes = await fetch(`https://youtube-transcript3.p.rapidapi.com/api/transcript-with-timestamps?video_id=${videoId}`, {
            headers: { "x-rapidapi-key": rapidApiKey, "x-rapidapi-host": "youtube-transcript3.p.rapidapi.com" }
          });

          if (rapidApiRes.ok) {
            const rapidData = await rapidApiRes.json();
            if (rapidData.transcript && Array.isArray(rapidData.transcript)) {
              transcriptText = rapidData.transcript.map((s: any) => s.text).join(" ");
            }
          }
        } catch (err) {}

        // Fallback 2: subtitles-for-youtube (different provider)
        if (!transcriptText) {
          try {
            console.log(`[YT API] Attempt 2: Fetching via subtitles-for-youtube for: ${videoId}`);
            const subRes = await fetch(`https://subtitles-for-youtube.p.rapidapi.com/subtitles/${videoId}`, {
              headers: { "x-rapidapi-key": rapidApiKey, "x-rapidapi-host": "subtitles-for-youtube.p.rapidapi.com" }
            });
            if (subRes.ok) {
              const subData = await subRes.json();
              if (subData.subtitles && Array.isArray(subData.subtitles)) {
                transcriptText = subData.subtitles.map((s: any) => s.text).join(" ");
              }
            }
          } catch (err) {}
        }

        // Fallback 3: Supadata (High Performance AI fallback)
        if (!transcriptText) {
          try {
            console.log(`[YT API] Attempt 3: Fetching via Supadata (AI Fallback) for: ${videoId}`);
            const supadataRes = await fetch(`https://youtube-transcripts.p.rapidapi.com/transcript?url=https://www.youtube.com/watch?v=${videoId}`, {
              headers: { "x-rapidapi-key": rapidApiKey, "x-rapidapi-host": "youtube-transcripts.p.rapidapi.com" }
            });
            if (supadataRes.ok) {
              const supadataData = await supadataRes.json();
              if (supadataData.content || supadataData.transcript) {
                 transcriptText = supadataData.content || supadataData.transcript;
                 console.log("[YT API] Supadata AI successfully generated content.");
              }
            }
          } catch (err) {}
        }
      }

      // --- ROBUST FALLBACK (FIRECRAWL DEEP SCRAPE) ---
      // This is crucial for videos WITHOUT captions but with descriptions/rich metadata
      if (!transcriptText || transcriptText.length < 50) {
        const firecrawlKey = process.env.FIRECRAWL_API_KEY;
        if (firecrawlKey) {
          console.log(`[YT API] Transcript unavailable. Final attempt via Firecrawl Deep-Scrape for: ${videoId}`);
          try {
            const firecrawlRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: { "Authorization": `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                url: `https://www.youtube.com/watch?v=${videoId}`,
                formats: ["markdown", "metadata"],
                waitFor: 3000 // Increased wait for heavy YT pages
              })
            });

            if (firecrawlRes.ok) {
              const fcData = await firecrawlRes.json();
              if (fcData.success && fcData.data) {
                const content = fcData.data.markdown || "";
                const title = fcData.data.metadata?.title || "";
                const description = fcData.data.metadata?.description || "";
                
                if (title || description || content.length > 500) {
                   transcriptText = `DEEP CONTEXT ANALYSIS (No Transcript Found):\n\nVideo Title: ${title}\n\nVideo Description:\n${description}\n\nExtracted Content Snippets:\n${content.substring(0, 8000)}`;
                   console.log(`[YT API] Harvested rich metadata (${transcriptText.length} chars). Continuing with AI Analysis.`);
                }
              }
            }
          } catch (fcErr) {}
        }
      }
    }

    // Final check for content
    if (!transcriptText || transcriptText.length < 20) {
      return NextResponse.json({ 
        error: "Privacy / Age Restriction: This video is locked by Google. I cannot access private or age-restricted videos automatically. \n\nFIX: Click 'Manual Mode' above and paste the transcript manually (Instructions: Open video on YouTube -> Click '... More' -> 'Show Transcript')." 
      }, { status: 400 });
    }

    console.log(`[YT API] Content ready for AI processing. Length: ${transcriptText.length} characters`);

    const openRouterApiKey = process.env.OPENROUTER_API_KEY
    if (!openRouterApiKey) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 })
    }

    // Call OpenRouter
    const models = [
      "google/gemini-flash-1.5:free",
      "deepseek/deepseek-chat",
      "x-ai/grok-beta"
    ]
    let summary = ""
    let lastError = ""

    const isMetadataOnly = transcriptText.includes("DEEP CONTEXT ANALYSIS");

    for (const model of models) {
      try {
        console.log(`[YT API] Attempting summary with model: ${model}`);
        const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterApiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ai-productivity-hub.vercel.app",
            "X-Title": "AI Productivity Hub"
          },
          body: JSON.stringify({
            model: model, 
            messages: [
              { 
                role: "system", 
                content: `You are an expert content analyzer. 
                ${isMetadataOnly 
                  ? "NOTICE: This video has NO CAPTIONS. Use the provided Title, Description, and Page snippets to reconstruct the video's core message and provide a detailed study." 
                  : "Your goal is to provide a deep, readable, and context-rich study of the provided transcript."}
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


import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Robust YouTube ID extraction (Shorts, Live, Embed, Mobile support)
function extractVideoId(url: string) {
  const patterns = [
    /(?:v=|\/v\/|embed\/|shorts\/|youtu\.be\/|\/v=|^)([^#&?]{11})/,
    /youtube\.com\/live\/([^#&?]{11})/,
    /youtube\.com\/watch\?.*v=([^#&?]{11})/,
    /m\.youtube\.com\/watch\?v=([^#&?]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return false;
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

        // Fallback 2: subtitles-for-youtube
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

        // Fallback 3: Supadata (AI Fallback)
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
      if (!transcriptText || transcriptText.length < 50) {
        const firecrawlKey = process.env.FIRECRAWL_API_KEY;
        if (firecrawlKey) {
          console.log(`[YT API] Transcript unavailable. Final attempt via Firecrawl Metadata Extraction for: ${videoId}`);
          try {
            const firecrawlRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: { "Authorization": `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                url: `https://www.youtube.com/watch?v=${videoId}`,
                formats: ["markdown", "metadata"],
                waitFor: 4000 
              })
            });

            if (firecrawlRes.ok) {
              const fcData = await firecrawlRes.ok ? await firecrawlRes.json() : null;
              if (fcData && fcData.success && fcData.data) {
                const content = fcData.data.markdown || "";
                const title = fcData.data.metadata?.title || "";
                const description = fcData.data.metadata?.description || "";
                
                if (title || description) {
                   transcriptText = `UNIVERSAL METADATA INFERENCE (No Transcript Available):\n\nVideo Title: ${title}\n\nVideo Description:\n${description}\n\nPage Context:\n${content.substring(0, 5000)}`;
                   console.log(`[YT API] Harvested deep metadata. Switching to AI Inference.`);
                }
              }
            }
          } catch (fcErr) {}
        }
      }

      // --- CRITICAL FALLBACK (OEmbed & Raw Scrape) ---
      // If Firecrawl fails, we try a direct OEmbed fetch which is very reliable for public videos
      if (!transcriptText || transcriptText.length < 20) {
        try {
          console.log(`[YT API] Final Attempt: OEmbed Fetch for: ${videoId}`);
          const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
          if (oembedRes.ok) {
            const oembedData = await oembedRes.json();
            const title = oembedData.title || "";
            const author = oembedData.author_name || "";
            if (title) {
              transcriptText = `UNIVERSAL METADATA INFERENCE (Public Metadata Only):\n\nVideo Title: ${title}\nCreator: ${author}\n\nNOTE: The AI will reconstruct the video's core message based on these public attributes.`;
              console.log("[YT API] OEmbed metadata retrieved. Proceeding with Inference.");
            }
          } else {
             // Absolute last resort: Scrape raw HTML for <title>
             const rawRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
             const html = await rawRes.text();
             const titleMatch = html.match(/<title>(.*?)<\/title>/);
             if (titleMatch && titleMatch[1]) {
               const title = titleMatch[1].replace('- YouTube', '').trim();
               transcriptText = `UNIVERSAL METADATA INFERENCE (Raw Title Scrape):\n\nVideo Title: ${title}\n\nNOTE: The AI will attempt to provide insights based on the title and its general knowledge of this topic.`;
               console.log("[YT API] Raw title scrape successful.");
             }
          }
        } catch (err) {}
      }
    }

    // Final check for content - Extremely relaxed. If we have a title, we try.
    if (!transcriptText || transcriptText.length < 5) {
      return NextResponse.json({ 
        error: "Access Blocked: This video is truly private or requires login. \n\nFIX: Open the video on YouTube, click '... More' -> 'Show Transcript', and use 'Manual Mode' to paste it here." 
      }, { status: 400 });
    }

    console.log(`[YT API] Starting AI Summarization. Mode: ${transcriptText.includes("UNIVERSAL METADATA INFERENCE") ? "Inference" : "Direct"}`);

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

    const isMetadataOnly = transcriptText.includes("UNIVERSAL METADATA INFERENCE");

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
      console.warn(`[YT API] AI Error: ${lastError}. Falling back to Heuristic Summary.`);
      // Heuristic Summary Generation (No AI Key Needed)
      const titleMatch = transcriptText.match(/Video Title: (.*?)\n/);
      const videoTitle = titleMatch ? titleMatch[1] : "YouTube Video";
      const descMatch = transcriptText.match(/Video Description:\n([\s\S]*?)\n\n/);
      const videoDesc = descMatch ? descMatch[1] : "";

      summary = `### 📋 Heuristic Video Overview (Basic Mode)
*The AI knowledge base is currently offline, so I've generated this study from the video's public metadata.*

**Video:** ${videoTitle}

#### 🎯 Core Objective
Based on the title "${videoTitle}", this content likely focuses on providing information or entertainment related to this topic.

#### 📝 Extracted Description Snippets
${videoDesc ? videoDesc.substring(0, 500) + "..." : "No detailed description was available for deeper analysis."}

#### 💡 Suggested Study Points
1. Review the title's core keywords to understand the primary subject.
2. Check the video creator's other content for context.
3. Use 'Manual Mode' to paste a specific transcript for a deeper, AI-powered analysis once the sync is restored.`;
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


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

      // --- CRITICAL FALLBACK (Omni-Fetch: OEmbed & Raw Scrape) ---
      if (!transcriptText || transcriptText.length < 20) {
        try {
          console.log(`[YT API] Omni-Fetch Attempt: Scraping raw data for: ${videoId}`);
          const rawUrl = `https://www.youtube.com/watch?v=${videoId}`;
          const rawRes = await fetch(rawUrl, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" }
          });
          
          if (rawRes.ok) {
            const html = await rawRes.text();
            
            // Extract from ytInitialPlayerResponse (The gold standard)
            const metaMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.*?});/);
            let scrapedTitle = "";
            let scrapedDesc = "";

            if (metaMatch && metaMatch[1]) {
              try {
                const json = JSON.parse(metaMatch[1]);
                scrapedTitle = json.videoDetails?.title || "";
                scrapedDesc = json.videoDetails?.shortDescription || "";
              } catch (e) {}
            }

            // Fallback to <title> tag
            if (!scrapedTitle) {
              const tagMatch = html.match(/<title>(.*?)<\/title>/);
              if (tagMatch) scrapedTitle = tagMatch[1].replace("- YouTube", "").trim();
            }

            if (scrapedTitle) {
              transcriptText = `[[METADATA_EXTRACTED]]\nTITLE: ${scrapedTitle}\nDESCRIPTION: ${scrapedDesc}`;
              console.log(`[YT API] Omni-Fetch success. Title: ${scrapedTitle.substring(0, 30)}...`);
            }
          }
        } catch (err) {
           console.error("[YT API] Omni-Fetch Error:", err);
        }
      }
    }

    // --- ZERO-BARRIER FALLBACK ---
    // If absolutely no data was found, we don't block. We send the URL to the AI.
    if (!transcriptText || transcriptText.length < 5) {
      transcriptText = `[[URL_ONLY_MODE]]\nVideo URL: ${url}`;
      console.log("[YT API] Scrapers provided zero data. Proceeding in Link-Only Mode.");
    }

    console.log(`[YT API] Summarizing. Mode: ${transcriptText.includes("[[URL_ONLY_MODE]]") ? "Link-Only" : transcriptText.includes("UNIVERSAL METADATA INFERENCE") ? "Inference" : "Direct"}`);

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
                ${transcriptText.includes("[[URL_ONLY_MODE]]")
                  ? "NOTICE: Accessibility scrapers failed to find a transcript. You are provided ONLY with the video URL. Please use your internal knowledge of this video or its metadata to provide a detailed study guide. If it is a very recent or private video you cannot see, explain that you are giving a general overview based on the link."
                  : isMetadataOnly 
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
      console.warn(`[YT API] AI Error: ${lastError}. Rendering Optimized Heuristic Study.`);
      
      const isOmni = transcriptText.includes("[[METADATA_EXTRACTED]]");
      let title = "YouTube Video Analysis";
      let description = "";

      if (isOmni) {
        title = transcriptText.split("TITLE: ")[1]?.split("\n")[0] || title;
        description = transcriptText.split("DESCRIPTION: ")[1] || "";
      } else {
        title = transcriptText.split("Video Title: ")[1]?.split("\n")[0] || title;
        description = transcriptText.split("Video Description:\n")[1]?.split("\n\n")[0] || "";
      }

      summary = `### 📋 Quick Study Guide: ${title}
*Note: The AI deep-analysis sync is currently offline. I've reconstructed this study using public video data.*

#### 🎯 Overview
This video, titled **"${title}"**, provides insights into this specific topic area. Based on the available context, it aims to educate or inform viewers about its key themes.

#### 📝 Key context from description:
${description ? description.substring(0, 800) + "..." : "The creator has provided a minimal description for this video, focusing on the visual content itself."}

#### 💡 Study Recommendations
1. **Analyze Title Keywords**: Focus on the main terms in "${title}" to understand the core message.
2. **Context Note**: Without an AI transcript, focus on the visual cues and the creator's reputation in this field.
3. **Deep Sync Solution**: If you need a word-for-word AI breakdown, please refresh your credentials or use 'Manual Mode' to paste the transcript.`;
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


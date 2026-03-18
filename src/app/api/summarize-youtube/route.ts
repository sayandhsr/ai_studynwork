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
            headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9"
            }
          });
          
          if (rawRes.ok) {
            const html = await rawRes.text();
            
            // Extract from ytInitialPlayerResponse (The gold standard)
            const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.*?});/);
            const playerDataMatch = html.match(/ytInitialData\s*=\s*({.*?});/);
            
            let scrapedTitle = "";
            let scrapedDesc = "";
            let scrapedAuthor = "";

            if (playerResponseMatch && playerResponseMatch[1]) {
              try {
                const json = JSON.parse(playerResponseMatch[1]);
                scrapedTitle = json.videoDetails?.title || "";
                scrapedDesc = json.videoDetails?.shortDescription || "";
                scrapedAuthor = json.videoDetails?.author || "";
              } catch (e) {}
            }

            // Enhanced fallback for Description via ytInitialData
            if (!scrapedDesc && playerDataMatch && playerDataMatch[1]) {
              try {
                const dataJson = JSON.parse(playerDataMatch[1]);
                // YouTube often nests descriptions deeply in InitialData
                const contents = dataJson.contents?.twoColumnWatchNextResults?.results?.results?.contents;
                const videoSecondaryInfo = contents?.find((c: any) => c.videoSecondaryInfoRenderer)?.videoSecondaryInfoRenderer;
                const descriptionText = videoSecondaryInfo?.description?.runs?.map((r: any) => r.text).join("");
                if (descriptionText) scrapedDesc = descriptionText;
              } catch (e) {}
            }

            // Fallback for Title/Description via Meta tags
            if (!scrapedTitle) {
              const metaTitle = html.match(/<meta\s+name="title"\s+content="(.*?)"/i) || html.match(/<title>(.*?)<\/title>/);
              if (metaTitle) scrapedTitle = metaTitle[1].replace("- YouTube", "").trim();
            }
            if (!scrapedDesc) {
              const metaDesc = html.match(/<meta\s+name="description"\s+content="(.*?)"/i);
              if (metaDesc) scrapedDesc = metaDesc[1];
            }

            if (scrapedTitle) {
              transcriptText = `[[METADATA_EXTRACTED]]\nTITLE: ${scrapedTitle}\nCREATOR: ${scrapedAuthor}\nCONTEXT_DESCRIPTION:\n${scrapedDesc}`;
              console.log(`[YT API] Omni-Fetch success. Title: ${scrapedTitle.substring(0, 30)}...`);
            }
          }
        } catch (err) {
           console.error("[YT API] Omni-Fetch Error:", err);
        }
      }
    }

    // --- CLASSIFICATION & MODE SELECTION ---
    const isFullTranscript = transcriptText.length > 50;
    const mode = isFullTranscript ? "transcript" : "metadata";

    // If metadata mode, ensure we have the title and description
    let finalTitle = "";
    let finalDescription = "";
    
    if (mode === "metadata") {
       console.log("[YT API] Switching to Metadata Mode (No Transcript Found).");
       // Extract if already in transcriptText from previous scrape
       if (transcriptText.includes("TITLE:")) {
          finalTitle = transcriptText.split("TITLE: ")[1]?.split("\n")[0] || "";
          finalDescription = transcriptText.split("CONTEXT_DESCRIPTION:\n")[1] || 
                             transcriptText.split("DESCRIPTION: ")[1] || "";
       }
       
       // Final fallback for title if still missing
       if (!finalTitle && videoId) {
          finalTitle = `Video Analysis: ${videoId}`;
       }
    }

    const openRouterApiKey = process.env.OPENROUTER_API_KEY
    if (!openRouterApiKey) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 })
    }

    // Call OpenRouter
    const models = [
      "google/gemini-flash-1.5:free",
      "deepseek/deepseek-chat",
      "anthropic/claude-3-haiku"
    ]
    let summaryResult = ""
    let lastError = ""

    for (const model of models) {
      try {
        console.log(`[YT API] Executing ${mode.toUpperCase()} Mode with model: ${model}`);
        
        let systemPrompt = "";
        let userContent = "";

        if (mode === "transcript") {
          systemPrompt = `You are a professional YouTube summarizer.
ONLY summarize the provided transcript.
Do not assume or add external knowledge.

Return:

Summary:
(2-3 sentences)

Key Points:
• point 1
• point 2
• point 3
• point 4
• point 5

Transcript:
${transcriptText}`;
          userContent = `Summarize this transcript: ${transcriptText.substring(0, 15000)}`;
        } else {
          systemPrompt = `You are analyzing a YouTube video WITHOUT transcript.
Based ONLY on the title and description, provide a reasonable high-level overview.

IMPORTANT:
* Do NOT hallucinate details
* Do NOT invent content
* Clearly mention that transcript is not available

Return:

Overview:
(2-3 sentence general idea)

Possible Topics:
• inferred topic 1
• inferred topic 2
• inferred topic 3

Note:
Transcript not available. This is a metadata-based summary.`;
          userContent = `Analyze this video based on metadata:
Title: ${finalTitle}
Description: ${finalDescription.substring(0, 5000)}`;
        }

        const openRouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterApiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ai-productivity-hub.workspace",
            "X-Title": "Study Sanctuary"
          },
          body: JSON.stringify({
            model: model, 
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userContent }
            ]
          }),
          signal: AbortSignal.timeout(60000)
        })

        if (openRouterRes.ok) {
          const data = await openRouterRes.json()
          if (data.choices && data.choices.length > 0) {
            summaryResult = data.choices[0].message.content
            break 
          }
        }
      } catch (err: any) {
        lastError = err.message
      }
    }

    // --- HEURISTIC FALLBACK (IF BOTH SCRAPE & AI FAIL) ---
    if (!summaryResult) {
      if (mode === "transcript") {
        summaryResult = `Summary:\nAn analytical review of the video's core message based on the provided transcript.\n\nKey Points:\n• Core content extraction failure\n• Please verify your link or refresh\n\nTranscript:\n${transcriptText.substring(0, 500)}`;
      } else if (finalTitle || finalDescription) {
        summaryResult = `Overview:\nA metadata-based analysis of "${finalTitle}". The content appears to cover themes identified in the title and description provided by the creator.\n\nPossible Topics:\n• ${finalTitle.substring(0, 50)}\n• Creator specialized insights\n\nNote:\nTranscript not available. This is a metadata-based summary.`;
      } else {
        summaryResult = "Unable to analyze this video. Please try another link.";
      }
    }

    // Save to database
    const { error: dbError } = await supabase
      .from("yt_summaries")
      .insert([
        { 
          user_id: user.id, 
          video_url: url || "Manual Entry", 
          summary: summaryResult 
        }
      ])

    if (dbError) {
      console.error("Database Save Error:", dbError)
    }

    return NextResponse.json({ summary: summaryResult })
    
  } catch (error: any) {
    console.error("Summarize API Error:", error)
    return NextResponse.json({ error: "Unable to analyze this video. Please try another link." }, { status: 500 })
  }
}


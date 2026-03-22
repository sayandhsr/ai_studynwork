import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { YoutubeTranscript } from 'youtube-transcript'
import { getSubtitles } from 'youtube-caption-extractor'
// @ts-ignore
import { YoutubeTranscript as YTPlay } from '@playzone/youtube-transcript'

// --- HELPERS ---

function extractVideoId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1).split("?")[0];
    if (parsed.searchParams.get("v")) return parsed.searchParams.get("v")?.split("?")[0];
    if (parsed.pathname.includes("/shorts/")) return parsed.pathname.split("/shorts/")[1].split("?")[0];
    if (parsed.pathname.includes("/embed/")) return parsed.pathname.split("/embed/")[1].split("?")[0];
    return null;
  } catch { return null; }
}

async function fetchTranscriptFromRapidAPI(vId: string, apiKey: string) {
  if (!apiKey) return null;
  console.log(`[TRANSCRIPT] Trying RapidAPI for ${vId}...`);
  try {
    // Try the most popular "YouTube v3 Alternative" transcript endpoint
    const res = await fetch(`https://youtube-v3-alternative.p.rapidapi.com/transcript?id=${vId}`, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "youtube-v3-alternative.p.rapidapi.com"
      },
      signal: AbortSignal.timeout(15000)
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log(`[TRANSCRIPT] RapidAPI Data Received`);
      
      // Handle array of {text, start, duration}
      if (Array.isArray(data)) {
        return data.map(t => t.text).join(" ");
      }
      // Handle { transcript: [...] }
      if (data.transcript && Array.isArray(data.transcript)) {
         return data.transcript.map((t: any) => t.text).join(" ");
      }
      // Handle { segments: [...] }
      if (data.segments && Array.isArray(data.segments)) {
         return data.segments.map((t: any) => t.text || t.snippet).join(" ");
      }
    }
    const errText = await res.text();
    console.error(`[TRANSCRIPT] RapidAPI failed for ${vId}:`, errText);
  } catch (e: any) {
    console.error(`[TRANSCRIPT] RapidAPI error:`, e.message);
  }
  return null;
}

async function fetchVideoDetailsFromRapidAPI(vId: string, apiKey: string) {
  if (!apiKey) return null;
  const hosts = ["youtube-v3-alternative.p.rapidapi.com", "youtube-v31.p.rapidapi.com"];
  
  for (const host of hosts) {
    try {
      console.log(`[METADATA] Trying RapidAPI on ${host}...`);
      const url = host.includes("alternative") 
        ? `https://${host}/video?id=${vId}`
        : `https://${host}/videos?part=snippet&id=${vId}`;

      const res = await fetch(url, {
        method: "GET",
        headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": host },
        signal: AbortSignal.timeout(10000)
      });

      if (res.ok) {
        const data = await res.json();
        // Handle alternative API structure
        if (data.title && data.title !== "YouTube") {
          return { title: data.title, description: data.description || "" };
        }
        // Handle v31/standard structure
        const item = data.items?.[0]?.snippet;
        if (item && item.title && item.title !== "YouTube") {
          return { title: item.title, description: item.description || "" };
        }
      }
    } catch (e) {
      console.error(`[METADATA] RapidAPI Metadata failed for ${host}`);
    }
  }
  return null;
}

async function fetchYoutubeMetadata(vId: string) {
  console.log(`[METADATA] Fetching YouTube metadata for ${vId}`);
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${vId}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" },
      signal: AbortSignal.timeout(10000)
    });
    if (res.ok) {
      const html = await res.text();
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      const descMatch = html.match(/\"shortDescription\":\"(.*?)\"/);
      
      let title = titleMatch ? titleMatch[1].replace(" - YouTube", "") : "";
      let description = descMatch ? descMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"') : "";
      
      // Try to find title in og:title if <title> was weird
      if (!title) {
        const ogTitleMatch = html.match(/property=\"og:title\" content=\"(.*?)\"/);
        if (ogTitleMatch) title = ogTitleMatch[1];
      }

      if (title || description) {
        return { title, description, full: `Video Title: ${title}\n\nVideo Description:\n${description}` };
      }
    }
  } catch(e) {}
  return null;
}

async function fetchYoutubeMetadataViaFirecrawl(vId: string, apiKey: string) {
  if (!apiKey) return null;
  console.log(`[METADATA] Trying Firecrawl for ${vId}...`);
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: `https://www.youtube.com/watch?v=${vId}`,
        formats: ["markdown"],
        onlyMainContent: true
      }),
      signal: AbortSignal.timeout(30000)
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data?.markdown) {
        return { 
          title: data.data.metadata?.title || "YouTube Video",
          description: data.data.markdown.substring(0, 5000)
        };
      }
    }
  } catch (e) {
    console.error(`[METADATA] Firecrawl failed:`, e);
  }
  return null;
}

async function synthesize(content: string, orKey: string, geminiKey?: string, groqKey?: string, videoTitle?: string, modeUsed?: string) {
  const isTranscript = content.toLowerCase().includes("transcript") || modeUsed?.includes("Transcript");
  
  const prompt = `You are an expert content synthesist. ${videoTitle ? `The video title is "${videoTitle}". ` : ""}
Summarize the following video content into 5-8 highly engaging, structured bullet points. 
Focus on the most actionable insights and "aha!" moments.

DIRECTIONS:
1. If this is a TRANSCRIPT, treat it as oral wisdom and extract the deepest points.
2. If this is ONLY a DESCRIPTION/METADATA, summarize what the video IS ABOUT and what a viewer can expect to learn.
3. DO NOT make up information. If you truly have no data to work with, say exactly: "ERROR: CONTENT TOTALLY INACCESSIBLE."
4. Format:
Title: [A Punchy, Curiosity-Gap Title]
Summary: [1-2 sentences of high-level context]
Key Points:
• [Point 1]
• [Point 2]...

Analyze the tone, core message, and specific details. Provide the absolute best value possible.`;

  const contentSnippet = content.substring(0, 15000);
  
  // 1. Try Groq (Fastest & most reliable)
  let groqResults = ""
  if (groqKey) {
    try {
      console.log(`[SYNTH] Trying Groq: llama-3.3-70b-versatile`);
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: `Instructions: ${prompt}\n\nContent:\n${contentSnippet}` }]
        }),
        signal: AbortSignal.timeout(20000)
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text && text.length > 50) {
          console.log(`[SYNTH] Groq Success!`);
          return { text: text.replace(/[*#`]/g, "").trim(), debug: `Engine: Groq | Mode: ${modeUsed}` };
        }
      } else {
        groqResults = `Groq Error ${res.status}. `;
      }
    } catch (e: any) {
      groqResults = `Groq: ${e.message}. `;
    }
  }

  // 2. Try Gemini Native
  let geminiResults = ""
  if (geminiKey) {
    const geminiAttempts = [
      { model: "gemini-2.0-flash", version: "v1beta" },
      { model: "gemini-1.5-flash", version: "v1" }
    ]
    for (const attempt of geminiAttempts) {
      try {
        console.log(`[SYNTH] Trying Gemini: ${attempt.model}`);
        const url = `https://generativelanguage.googleapis.com/${attempt.version}/models/${attempt.model}:generateContent?key=${geminiKey}`
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: `Instructions: ${prompt}\n\nContent:\n${contentSnippet}` }] }]
          }),
          signal: AbortSignal.timeout(20000)
        })

        if (res.ok) {
          const data = await res.json()
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (text && text.length > 50) {
            console.log(`[SYNTH] Gemini Success with ${attempt.model}`);
            return { text: text.replace(/[*#`]/g, "").trim(), debug: `Engine: Gemini (${attempt.model}) | Mode: ${modeUsed}` };
          }
        }
      } catch (e: any) {
        geminiResults += `${attempt.model}: ${e.message}. `
      }
    }
  }

  // 3. Try OpenRouter (Final Fallback)
  let orResults = ""
  if (orKey) {
    const orModels = [
      "google/gemini-2.0-flash-lite-preview-02-05:free",
      "mistralai/mistral-7b-instruct:free"
    ];
    for (const model of orModels) {
      try {
        console.log(`[SYNTH] Trying OpenRouter: ${model}`)
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${orKey}`, 
            "Content-Type": "application/json",
            "HTTP-Referer": "https://ai-studynwork.vercel.app",
            "X-Title": "Study Nest Sanctuary"
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: `Instructions: ${prompt}\n\nContent:\n${content.substring(0, 8000)}` }]
          }),
          signal: AbortSignal.timeout(30000)
        });

        if (res.ok) {
          const data = await res.json();
          const text = (data.choices?.[0]?.message?.content || "").replace(/[*#`]/g, "").trim();
          if (text && text.length > 50) {
             console.log(`[SYNTH] OpenRouter Success with ${model}`);
             return { text, debug: `Engine: OpenRouter (${model}) | Mode: ${modeUsed}` };
          }
        }
      } catch (e: any) {
         orResults += `${model}: ${e.message}. `
      }
    }
  }
  
  throw new Error(`Synthesis Failed Details: (Groq: ${groqResults}) (Gemini: ${geminiResults}) (OR: ${orResults})`);
}

// --- MAIN ROUTE ---

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const videoUrl = body.videoUrl || body.url || "";
    const manualTranscript = body.manualTranscript || "";
    
    if (!videoUrl && !manualTranscript) {
      return NextResponse.json({ error: "Missing video URL or transcript" }, { status: 400 });
    }

    const orKey = process.env.OPENROUTER_API_KEY || "";
    const geminiKey = process.env.GEMINI_API_KEY || "";
    const groqKey = process.env.GROQ_API_KEY || "";
    
    const vId = videoUrl ? extractVideoId(videoUrl) : "manual";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let finalContent = manualTranscript || "";
    let modeUsed = manualTranscript ? "Manual" : "Native";

    // 1. TRY NATIVE TRANSCRIPT (youtube-transcript)
    if (!finalContent && vId && vId !== "manual" && vId !== "unknown") {
      try {
        console.log(`[TRANSCRIPT] Trying youtube-transcript for ${vId}`);
        const transcript = await YoutubeTranscript.fetchTranscript(vId);
        if (transcript && transcript.length > 0) {
          finalContent = transcript.map(t => t.text).join(" ");
          modeUsed = "Native Transcript (V1)";
        }
      } catch (e) {
        console.error(`[TRANSCRIPT] Native V1 failed for ${vId}`);
      }
    }

    // 2. TRY @PLAYZONE/YOUTUBE-TRANSCRIPT
    if (!finalContent && vId && vId !== "manual" && vId !== "unknown") {
      try {
        console.log(`[TRANSCRIPT] Trying @playzone/youtube-transcript for ${vId}`);
        const transcript = await YTPlay.fetchTranscript(vId);
        if (transcript && transcript.length > 0) {
          finalContent = transcript.map((t: any) => t.text).join(" ");
          modeUsed = "Native Transcript (V2)";
        }
      } catch (e) {
        console.error(`[TRANSCRIPT] Native V2 failed for ${vId}`);
      }
    }

    // 3. TRY YOUTUBE-CAPTION-EXTRACTOR
    if (!finalContent && vId && vId !== "manual" && vId !== "unknown") {
      try {
        console.log(`[TRANSCRIPT] Trying youtube-caption-extractor for ${vId}`);
        const transcript = await getSubtitles({ videoID: vId, lang: 'en' });
        if (transcript && transcript.length > 0) {
          finalContent = transcript.map((t: any) => t.text).join(" ");
          modeUsed = "Native Transcript (V3)";
        }
      } catch (e) {
        console.error(`[TRANSCRIPT] Native V3 failed for ${vId}`);
      }
    }

    // 4. TRY RAPIDAPI TRANSCRIPT (Most reliable)
    if (!finalContent && vId && vId !== "manual" && vId !== "unknown" && process.env.RAPIDAPI_KEY) {
      const rapidTranscript = await fetchTranscriptFromRapidAPI(vId, process.env.RAPIDAPI_KEY || "");
      if (rapidTranscript) {
        finalContent = rapidTranscript;
        modeUsed = "RapidAPI Transcript";
      }
    }

    // 5. METADATA SCRAPE (Title + Description)
    let videoTitle = "";
    if (vId && vId !== "manual" && vId !== "unknown") {
       // A. Try RapidAPI for metadata (Super reliable)
       const rapidMeta = await fetchVideoDetailsFromRapidAPI(vId, process.env.RAPIDAPI_KEY || "");
       if (rapidMeta) {
         videoTitle = rapidMeta.title;
         if (!finalContent && rapidMeta.description) {
           finalContent = `Video Title: ${rapidMeta.title}\n\nVideo Description:\n${rapidMeta.description}`;
           modeUsed = "RapidAPI Metadata";
         }
       }

       // C. Try Firecrawl (Deep Scrape) if still no content
       if (!videoTitle || !finalContent) {
         const fireMeta = await fetchYoutubeMetadataViaFirecrawl(vId, process.env.FIRECRAWL_API_KEY || "");
         if (fireMeta) {
           videoTitle = videoTitle || fireMeta.title;
           if (!finalContent && fireMeta.description) {
             finalContent = `Video Title: ${fireMeta.title}\n\nVideo Content (Scraped):\n${fireMeta.description}`;
             modeUsed = "Firecrawl Deep Scrape";
           }
         }
       }

       // D. Fallback to direct scrape
       if (!videoTitle || !finalContent) {
         const metadata = await fetchYoutubeMetadata(vId);
         if (metadata) {
           videoTitle = videoTitle || metadata.title;
           if (!finalContent && metadata.full.length > 50) {
             finalContent = metadata.full;
             modeUsed = "Metadata Scrape";
           }
         }
       }
    }

    // 6. STOP ONLY IF COMPLETELY EMPTY
    if (!finalContent && !videoTitle) {
      console.warn(`[TRANSCRIPT] STOPPING: No valid content found for ${vId}`);
      return NextResponse.json({ 
        summary: `Title: Content Inaccessible\nSummary: YouTube is currently blocking our automated access to this video's data. \nKey Points:\n• Direct transcripts and descriptions are unavailable.\n• You can manually paste the text in the "Manual Scribe" tab.\n• Or try a different video link.`,
        mode_used: "Failure"
      });
    }

    // 7. SYNTHESIZE (V6.0 handles short content)
    const synthesisResult = await synthesize(finalContent || videoTitle || "Unknown Video", orKey, geminiKey, groqKey, videoTitle, modeUsed);
    const summary = synthesisResult.text;
    const debugInfo = synthesisResult.debug;

    // 8. DB CACHE
    if (user && summary.length > 50 && vId && vId !== "manual" && !summary.includes("ERROR:")) {
      try {
        await supabase.from("yt_summaries").upsert([{ 
          user_id: user.id, 
          video_id: vId, 
          video_url: videoUrl || "",
          summary, 
          mode_used: `${modeUsed} (${debugInfo})` 
        }], { onConflict: 'video_id' });
      } catch (e) { console.log("DB cache skipped."); }
    }

    return NextResponse.json({ summary, v: "26.0", debug: debugInfo, mode_used: modeUsed });

  } catch (error: any) {
    console.error("[V25.2] Critical API Error:", error);
    const errorMessage = error?.message || "The backend encountered a severe execution error.";
    return NextResponse.json({ 
      summary: `Title: Synthesis Failed (v25.2)\nSummary: ${errorMessage}\nKey Points:\n• Please ensure your API keys have sufficient credits.\n• If the video is very new, transcripts may not be available yet.`,
      v: "25.2"
    });
  }
}

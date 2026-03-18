import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Robust YouTube ID extraction (Shorts, Live, Embed, Mobile support)
function extractVideoId(url: string) {
  if (!url) return null;
  const patterns = [
    /(?:v=|\/v\/|embed\/|shorts\/|youtu\.be\/|\/v=|^)([^#&?]{11})/,
    /youtube\.com\/live\/([^#&?]{11})/,
    /youtube\.com\/watch\?.*v=([^#&?]{11})/,
    /m\.youtube\.com\/watch\?v=([^#&?]{11})/,
    /youtu\.be\/([^#&?]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

// Helper for AI Chunk Summarization
async function summarizeChunk(chunk: string, openRouterApiKey: string) {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ai-productivity-hub.workspace",
        "X-Title": "Study Sanctuary"
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5:free", 
        messages: [{ 
            role: "system", 
            content: "You are a professional YouTube summarizer. Summarize this specific transcript segment accurately. Do not invent info." 
        }, { 
            role: "user", 
            content: chunk.substring(0, 4000) 
        }]
      }),
      signal: AbortSignal.timeout(12000) // 12s AI timeout per chunk
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (e) {
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const { url, manualTranscript } = await req.json()

    if (!url && !manualTranscript) {
      return NextResponse.json({ error: "URL or transcript is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const videoId = url ? extractVideoId(url) : null

    // --- STEP 1: CACHE OPTIMIZATION (Check by video_id) ---
    if (videoId) {
      const { data: existing } = await supabase
        .from("yt_summaries")
        .select("summary")
        .eq("video_id", videoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existing?.summary) {
        console.log(`[YT API] Cache Hit for ID: ${videoId}`);
        return NextResponse.json({ summary: existing.summary, cached: true })
      }
    }

    let transcriptText = manualTranscript || ""
    let finalTitle = ""
    let finalDescription = ""

    // --- STEP 2: FETCH TRANSCRIPT (7s Timeout) ---
    if (!transcriptText && videoId) {
      const rapidApiKey = process.env.RAPIDAPI_KEY;
      if (rapidApiKey) {
        try {
          // RapidAPI Parallel Check (Fastest win)
          const transcriptProviders = [
            `https://youtube-transcript3.p.rapidapi.com/api/transcript-with-timestamps?video_id=${videoId}`,
            `https://subtitles-for-youtube.p.rapidapi.com/subtitles/${videoId}`
          ];

          const results = await Promise.race([
            Promise.all(transcriptProviders.map(async (u) => {
              const res = await fetch(u, {
                headers: { "x-rapidapi-key": rapidApiKey },
                signal: AbortSignal.timeout(7000)
              });
              if (!res.ok) return null;
              const data = await res.json();
              if (Array.isArray(data.transcript)) return data.transcript.map((s: any) => s.text).join(" ");
              if (Array.isArray(data.subtitles)) return data.subtitles.map((s: any) => s.text).join(" ");
              return null;
            })).then(r => r.filter(Boolean)),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 7000))
          ]) as string[];

          if (results && results.length > 0) transcriptText = results[0];
        } catch (err) {}
      }

      // --- STEP 3: FETCH METADATA (Strict Mode Pivot) ---
      if (!transcriptText || transcriptText.length < 50) {
        try {
            console.log("[YT API] Transcript failed or too short. Fetching Metadata...");
            const rawUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const rawRes = await fetch(rawUrl, {
                headers: { "User-Agent": "Mozilla/5.0" },
                signal: AbortSignal.timeout(5000)
            });
            if (rawRes.ok) {
                const html = await rawRes.text();
                const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.*?});/);
                if (playerResponseMatch && playerResponseMatch[1]) {
                    const json = JSON.parse(playerResponseMatch[1]);
                    finalTitle = json.videoDetails?.title || "";
                    finalDescription = json.videoDetails?.shortDescription || "";
                }
            }
        } catch (e) {}
      }
    }

    // --- STEP 4: DECISION LOGIC & AI ---
    const isFullTranscript = transcriptText.length > 50;
    const mode = isFullTranscript ? "transcript" : "metadata";
    const openRouterApiKey = process.env.OPENROUTER_API_KEY
    if (!openRouterApiKey) return NextResponse.json({ error: "AI service not configured" }, { status: 500 })

    let finalSummary = "";

    if (mode === "transcript") {
      // --- TRANSCRIPT CHUNKING (2.5k chars, Max 8 chunks) ---
      const chunkSize = 2500;
      const chunks = [];
      for (let i = 0; i < transcriptText.length && chunks.length < 8; i += chunkSize) {
        chunks.push(transcriptText.substring(i, i + chunkSize));
      }

      console.log(`[YT API] Processing ${chunks.length} transcript chunks in parallel...`);
      const chunkSummaries = await Promise.all(chunks.map(c => summarizeChunk(c, openRouterApiKey)));
      const filteredChunks = chunkSummaries.filter(Boolean);

      // Final Synthesis
      const synthesisRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://ai-productivity-hub.workspace",
          "X-Title": "Study Sanctuary"
        },
        body: JSON.stringify({
          model: "google/gemini-flash-1.5:free", 
          messages: [
            { 
              role: "system", 
              content: `You are a professional YouTube summarizer. ONLY summarize the provided segments. Do NOT assume or invent information.

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
${transcriptText.substring(0, 10000)}` 
            },
            { role: "user", content: `Synthesize these segment summaries: ${filteredChunks.join("\n\n")}` }
          ]
        }),
        signal: AbortSignal.timeout(12000)
      });
      if (synthesisRes.ok) {
        const data = await synthesisRes.json();
        finalSummary = data.choices?.[0]?.message?.content || "";
      }
    } else if (finalTitle || finalDescription) {
      // --- METADATA MODE ---
      const metaRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://ai-productivity-hub.workspace",
          "X-Title": "Study Sanctuary"
        },
        body: JSON.stringify({
          model: "google/gemini-flash-1.5:free", 
          messages: [
            { 
              role: "system", 
              content: `You are analyzing a YouTube video WITHOUT transcript. Based ONLY on the title and description, provide a reasonable high-level overview. DO NOT hallucinate.

Return:
Overview:
(2-3 sentence general idea)

Possible Topics:
• inferred topic 1
• inferred topic 2
• inferred topic 3

Note:
Transcript not available. This is a metadata-based summary.` 
            },
            { role: "user", content: `Analyze: Title: ${finalTitle}\nDescription: ${finalDescription}` }
          ]
        }),
        signal: AbortSignal.timeout(12000)
      });
      if (metaRes.ok) {
        const data = await metaRes.json();
        finalSummary = data.choices?.[0]?.message?.content || "";
      }
    }

    if (!finalSummary) {
       return NextResponse.json({ error: "Unable to analyze this video. Please try another link." }, { status: 404 });
    }

    // --- PERSISTENCE ---
    await supabase.from("yt_summaries").insert([
      { 
        user_id: user.id, 
        video_url: url || "Manual Entry", 
        video_id: videoId || null,
        summary: finalSummary 
      }
    ]);

    return NextResponse.json({ summary: finalSummary })
    
  } catch (error: any) {
    console.error("Summarize API Error:", error)
    return NextResponse.json({ error: "Unable to analyze this video. Please try another link." }, { status: 500 })
  }
}


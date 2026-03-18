import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * UNIVERSAL YOUTUBE SUMMARIZER V3
 * Features:
 * 1. Zero-Failure Hierarchy (Transcript -> Metadata -> Audio AI)
 * 2. User Quotas for Expensive AI Transcription (3/day)
 * 3. Deep Caching by Video ID
 * 4. Source Transparency (mode_used returned to UI)
 */

// Robust YouTube ID extraction
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

// AI Summarization Helper
async function summarizeContent(content: string, mode: string, openRouterApiKey: string, extraMetadata?: any) {
  const systemPrompts: Record<string, string> = {
    transcript: `You are a professional YouTube summarizer. Summarize this transcript accurately. Do not invent info. Return: Summary: (2-3 lines), Key Points: (5 bullets).`,
    audio: `You are analyzing an AI-GENERATED transcript from a video's audio. Summarize the core message accurately. Return: Summary: (2-3 lines), Key Points: (5 bullets).`,
    metadata: `You are analyzing a video WITHOUT a transcript. Based ONLY on the title and description, provide a high-level overview. DO NOT hallucinate. Return: Overview: (2-3 lines), Possible Topics: (3 bullets).`
  };

  const userContent = mode === "metadata" 
    ? `Analyze this video: Title: ${extraMetadata?.title}\nDescription: ${extraMetadata?.description}`
    : `Summarize this text: ${content.substring(0, 12000)}`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterApiKey}`,
        "Content-Type": "application/json",
        "X-Title": "Study Sanctuary"
      },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5:free", 
        messages: [
          { role: "system", content: systemPrompts[mode] || systemPrompts.transcript },
          { role: "user", content: userContent }
        ]
      }),
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (e) {
    console.error("[AI API] Synthesis Error:", e);
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const { url, manualTranscript } = await req.json()
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;

    if (!url && !manualTranscript) {
      return NextResponse.json({ error: "URL or transcript is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 })

    const videoId = url ? extractVideoId(url) : null
    console.log(`[V3 API] Processing: ID=${videoId}, Path=${url || 'Manual'}`);

    // --- TIER 0: CACHE HIT ---
    if (videoId) {
      const { data: existing } = await supabase
        .from("yt_summaries")
        .select("summary, mode_used")
        .eq("video_id", videoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existing?.summary) {
        console.log(`[V3 API] Cache Hit for ID: ${videoId} (Mode: ${existing.mode_used})`);
        return NextResponse.json({ 
          summary: existing.summary, 
          mode_used: existing.mode_used || "cached",
          cached: true 
        })
      }
    }

    let finalContent = manualTranscript || ""
    let finalTitle = ""
    let finalDescription = ""
    let modeUsed: "transcript" | "metadata" | "audio" | "manual" = manualTranscript ? "manual" : "transcript"

    // --- TIER 1: NATIVE TRANSCRIPT (5s Timeout) ---
    if (!finalContent && videoId && rapidApiKey) {
      try {
        console.log(`[V3 API] Tier 1: Fetching Native Transcript for: ${videoId}`);
        const res = await fetch(`https://youtube-transcript3.p.rapidapi.com/api/transcript-with-timestamps?video_id=${videoId}`, {
          headers: { "x-rapidapi-key": rapidApiKey },
          signal: AbortSignal.timeout(5000)
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.transcript)) {
            finalContent = data.transcript.map((s: any) => s.text).join(" ");
            console.log(`[V3 API] Tier 1 Success. Length: ${finalContent.length}`);
          }
        }
      } catch (e) {
        console.warn("[V3 API] Tier 1 Failed/Timeout");
      }
    }

    // --- TIER 2: METADATA EXTRACTION (5s Timeout) ---
    if (!finalContent && videoId) {
      modeUsed = "metadata";
      try {
        console.log(`[V3 API] Tier 1 Failed. Tier 2: Harvesting Metadata for: ${videoId}`);
        // Fallback 1: OEmbed (Official & Reliable for Title/Author)
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, {
          signal: AbortSignal.timeout(3000)
        });
        if (oembedRes.ok) {
          const odata = await oembedRes.json();
          finalTitle = odata.title || "";
        }

        // Fallback 2: Raw Scrape for Description
        const rawRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
          headers: { "User-Agent": "Mozilla/5.0" },
          signal: AbortSignal.timeout(5000)
        });
        if (rawRes.ok) {
          const html = await rawRes.text();
          const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.*?});/);
          if (playerMatch) {
            const pjson = JSON.parse(playerMatch[1]);
            if (!finalTitle) finalTitle = pjson.videoDetails?.title || "";
            finalDescription = pjson.videoDetails?.shortDescription || "";
          }
        }
        console.log(`[V3 API] Tier 2 Result: Title='${finalTitle.substring(0, 20)}...', DescLength=${finalDescription.length}`);
      } catch (e) {
        console.warn("[V3 API] Tier 2 Failed/Timeout");
      }
    }

    // --- TIER 3: AI AUDIO TRANSCRIPTION (20s Timeout) ---
    // Triggered ONLY if Metadata is thin and Transcript is missing
    const isMetadataThin = !finalTitle && (!finalDescription || finalDescription.length < 50);
    if (!finalContent && isMetadataThin && videoId && rapidApiKey) {
      try {
        console.log("[V3 API] Tier 2 Thin. Checking Quota for Tier 3 (Audio AI)...");
        
        // --- QUOTA GUARD (3/day) ---
        const { count, error: quotaError } = await supabase
          .from("yt_summaries")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("mode_used", "audio")
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (quotaError) throw quotaError;
        if (count && count >= 3) {
           return NextResponse.json({ error: "Daily AI Audio Transcription quota (3) reached. Please try metadata mode or another video." }, { status: 429 });
        }

        console.log(`[V3 API] Quota OK (${count || 0}/3). Tier 3: Transcribing Audio for: ${videoId}`);
        modeUsed = "audio";
        
        // Using Supadata AI Fallback (RapidAPI)
        const aiRes = await fetch(`https://youtube-transcripts.p.rapidapi.com/transcript?url=https://www.youtube.com/watch?v=${videoId}`, {
          headers: { "x-rapidapi-key": rapidApiKey },
          signal: AbortSignal.timeout(20000)
        });
        
        if (aiRes.ok) {
          const aidata = await aiRes.json();
          finalContent = aidata.content || aidata.transcript || "";
          console.log(`[V3 API] Tier 3 Success via AI. Length: ${finalContent.length}`);
        }
      } catch (e) {
        console.error("[V3 API] Tier 3 Implementation Error:", e);
      }
    }

    // --- FINAL SYNTHESIS ---
    if (!finalContent && !finalTitle) {
      return NextResponse.json({ error: "Unable to analyze this video. Please try another link." }, { status: 404 });
    }

    console.log(`[V3 API] Executing Synthesis. Mode: ${modeUsed}`);
    const summary = await summarizeContent(finalContent, modeUsed, openRouterApiKey!, { title: finalTitle, description: finalDescription });

    if (!summary) throw new Error("AI Synthesis failed");

    // --- PERSISTENCE ---
    const { error: dbError } = await supabase.from("yt_summaries").insert([
      { 
        user_id: user.id, 
        video_url: url || "Manual Entry", 
        video_id: videoId || null,
        summary: summary,
        mode_used: modeUsed
      }
    ]);
    if (dbError) console.error("[V3 API] Database Save Error:", dbError);

    return NextResponse.json({ 
      summary, 
      mode_used: modeUsed 
    })
    
  } catch (error: any) {
    console.error("[V3 API] Global Error:", error)
    return NextResponse.json({ error: "Unable to analyze this video. Please try another link." }, { status: 500 })
  }
}


import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * CONTENT-FIRST YOUTUBE SUMMARIZER V4 (Zero-Failure)
 * Hierarchy: 
 * 1. Native Transcript (Primary)
 * 2. AI Audio Transcription (Secondary)
 * 3. Metadata (Fallback - Limited Accuracy)
 */

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

// AI Synthesis Helper
async function synthesize(content: string, mode: string, openRouterApiKey: string, meta?: any) {
  const systemPrompts: Record<string, string> = {
    transcript: "You are a professional YouTube summarizer. Summarize this official transcript accurately. Return: Summary: (2-3 lines), Key Points: (5 bullets).",
    audio: "You are analyzing an AI-GENERATED transcript from video audio. Summarize the content accurately. Return: Summary: (2-3 lines), Key Points: (5 bullets).",
    metadata: "You are analyzing a video WITHOUT spoken content. Based ONLY on the title/description, provide a high-level overview. Return: Overview: (2-3 lines), Possible Topics: (3 bullets). [Source: Limited Evidence]"
  };

  const userPrompt = mode === "metadata" 
    ? `Title: ${meta?.title}\nDescription: ${meta?.description}`
    : content.substring(0, 15000);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${openRouterApiKey}`, "Content-Type": "application/json", "X-Title": "Study Sanctuary" },
      body: JSON.stringify({
        model: "google/gemini-flash-1.5:free",
        messages: [{ role: "system", content: systemPrompts[mode] || systemPrompts.transcript }, { role: "user", content: userPrompt }]
      }),
      signal: AbortSignal.timeout(15000)
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (e) { return ""; }
}

export async function POST(req: Request) {
  try {
    const { url, manualTranscript } = await req.json()
    const rapidKey = process.env.RAPIDAPI_KEY;
    const orKey = process.env.OPENROUTER_API_KEY;

    if (!url && !manualTranscript) return NextResponse.json({ error: "Input required" }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Auth required" }, { status: 401 })

    const videoId = url ? extractVideoId(url) : null

    // --- TIER 0: CACHE ---
    if (videoId) {
      const { data: cached } = await supabase.from("yt_summaries")
        .select("summary, mode_used").eq("video_id", videoId).maybeSingle();
      if (cached?.summary) return NextResponse.json({ summary: cached.summary, mode_used: cached.mode_used, cached: true });
    }

    let summary = "";
    let finalContent = manualTranscript || "";
    let finalMode: "transcript" | "audio" | "metadata" | "manual" = manualTranscript ? "manual" : "transcript";

    // --- TIER 1: NATIVE TRANSCRIPT (Short-Circuit) ---
    if (!finalContent && videoId && rapidKey) {
      for (let attempt = 0; attempt < 2; attempt++) { // Retry once
        try {
          console.log(`[V4 API] Tier 1 Attempt ${attempt + 1}: ${videoId}`);
          const res = await fetch(`https://youtube-transcript3.p.rapidapi.com/api/transcript-with-timestamps?video_id=${videoId}`, {
            headers: { "x-rapidapi-key": rapidKey },
            signal: AbortSignal.timeout(5000)
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.transcript)) {
              finalContent = data.transcript.map((s: any) => s.text).join(" ");
              summary = await synthesize(finalContent, "transcript", orKey!);
              if (summary) { finalMode = "transcript"; break; }
            }
          }
        } catch (e) { console.warn(`[V4 API] T1 Attempt ${attempt + 1} Failed`); }
      }
    }

    // --- TIER 2: AI AUDIO TRANSCRIPTION (Short-Circuit) ---
    if (!summary && videoId && rapidKey) {
      console.log(`[V4 API] T1 Failed. Tier 2 (Audio AI) Triggered: ${videoId}`);
      for (let attempt = 0; attempt < 2; attempt++) { // Retry once
        try {
          const aiRes = await fetch(`https://youtube-transcripts.p.rapidapi.com/transcript?url=https://www.youtube.com/watch?v=${videoId}`, {
            headers: { "x-rapidapi-key": rapidKey },
            signal: AbortSignal.timeout(20000)
          });
          if (aiRes.ok) {
            const aidata = await aiRes.json();
            const text = aidata.content || aidata.transcript || "";
            if (text.length > 100) {
              summary = await synthesize(text, "audio", orKey!);
              if (summary) { finalMode = "audio"; finalContent = text; break; }
            }
          }
        } catch (e) { console.warn(`[V4 API] T2 Attempt ${attempt + 1} Failed`); }
      }
    }

    // --- TIER 3: METADATA FALLBACK ---
    if (!summary && videoId) {
      console.log(`[V4 API] T1/T2 Failed. Tier 3 (Metadata) Triggered: ${videoId}`);
      finalMode = "metadata";
      try {
        const oembed = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`).then(r => r.json());
        const rawHtml = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { headers: { "User-Agent": "Mozilla/5.0" } }).then(r => r.text());
        const playerMatch = rawHtml.match(/ytInitialPlayerResponse\s*=\s*({.*?});/);
        const description = playerMatch ? JSON.parse(playerMatch[1]).videoDetails?.shortDescription : "";
        summary = await synthesize("", "metadata", orKey!, { title: oembed.title, description });
      } catch (e) { console.error("[V4 API] T3 Metadata Failed", e); }
    }

    // --- PERSISTENCE & RETURN ---
    if (!summary) return NextResponse.json({ error: "All extraction tiers failed for this video." }, { status: 404 });

    await supabase.from("yt_summaries").insert([{
      user_id: user.id,
      video_url: url || "Manual",
      video_id: videoId || null,
      summary: summary,
      transcript: finalContent,
      mode_used: finalMode
    }]);

    return NextResponse.json({ summary, mode_used: finalMode });

  } catch (error) {
    console.error("[V4 API] Global Fatal:", error);
    return NextResponse.json({ error: "An unexpected error occurred in the extraction pipeline." }, { status: 500 });
  }
}


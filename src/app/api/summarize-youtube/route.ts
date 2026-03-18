import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * BULLETPROOF YOUTUBE SUMMARIZER V5
 * Logic: Strictly Sequential Fallback
 * No early returns on failure.
 */

function extractVideoId(url: string) {
  const regExp = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}

// AI Synthesis Helper
async function synthesize(content: string, mode: string, openRouterApiKey: string, meta?: any) {
  const systemPrompts: Record<string, string> = {
    transcript: "Summarize this official transcript accurately. Return: Summary: (2-3 lines), Key Points: (5 bullets).",
    audio: "Summarize this AI-Generated spoken content accurately. Return: Summary: (2-3 lines), Key Points: (5 bullets).",
    metadata: "Based ONLY on the title/description, provide a high-level overview. Return: Overview: (2-3 lines), Possible Topics: (3 bullets). [Source: Metadata (Limited Accuracy)]"
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
    if (!videoId && !manualTranscript) return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 })

    console.log("Video ID:", videoId)

    // --- CACHE CHECK ---
    if (videoId) {
      const { data: cached } = await supabase.from("yt_summaries")
        .select("summary, mode_used").eq("video_id", videoId).maybeSingle();
      if (cached?.summary) return NextResponse.json({ summary: cached.summary, mode_used: cached.mode_used, cached: true });
    }

    let summary = "";
    let transcriptText = manualTranscript || "";
    let audioTranscriptText = "";
    let metadataResult = null;

    // --- 1. TRANSCRIPT STEP ---
    if (!transcriptText && videoId && rapidKey) {
      try {
        const res = await fetch(`https://youtube-transcript3.p.rapidapi.com/api/transcript-with-timestamps?video_id=${videoId}`, {
          headers: { "x-rapidapi-key": rapidKey },
          signal: AbortSignal.timeout(6000)
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.transcript)) {
            transcriptText = data.transcript.map((s: any) => s.text).join(" ");
            console.log("Transcript length:", transcriptText.length)
            if (transcriptText.length > 50) {
              summary = await synthesize(transcriptText, "transcript", orKey!);
              if (summary) {
                await supabase.from("yt_summaries").insert([{ user_id: user.id, video_url: url, video_id: videoId, summary, transcript: transcriptText, mode_used: "transcript" }]);
                return NextResponse.json({ summary, mode_used: "transcript" });
              }
            }
          }
        }
      } catch (e) {}
      console.log("Transcript failed");
    }

    // --- 2. AUDIO STEP (Must run if T1 fails) ---
    if (!summary && videoId && rapidKey) {
      console.log("Triggering audio fallback")
      try {
        const aiRes = await fetch(`https://youtube-transcripts.p.rapidapi.com/transcript?url=https://www.youtube.com/watch?v=${videoId}`, {
          headers: { "x-rapidapi-key": rapidKey },
          signal: AbortSignal.timeout(20000)
        });
        if (aiRes.ok) {
          const aidata = await aiRes.json();
          audioTranscriptText = aidata.content || aidata.transcript || "";
          console.log("Audio transcript length:", audioTranscriptText.length)
          if (audioTranscriptText.length > 50) {
            summary = await synthesize(audioTranscriptText, "audio", orKey!);
            if (summary) {
              await supabase.from("yt_summaries").insert([{ user_id: user.id, video_url: url, video_id: videoId, summary, transcript: audioTranscriptText, mode_used: "audio" }]);
              return NextResponse.json({ summary, mode_used: "audio" });
            }
          }
        }
      } catch (err) {}
      console.log("Audio failed");
    }

    // --- 3. METADATA STEP (Final Fallback) ---
    if (!summary && videoId) {
      console.log("Triggering metadata fallback")
      try {
        const metaRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (metaRes.ok) {
          metadataResult = await metaRes.json();
          console.log("Metadata:", metadataResult)
          if (metadataResult && metadataResult.title) {
            summary = await synthesize("", "metadata", orKey!, { title: metadataResult.title, description: metadataResult.author_name });
            if (summary) {
              await supabase.from("yt_summaries").insert([{ user_id: user.id, video_url: url, video_id: videoId, summary, mode_used: "metadata" }]);
              return NextResponse.json({ summary, mode_used: "metadata" });
            }
          }
        }
      } catch (e) {}
    }

    // --- FINAL FAILSAFE ---
    return NextResponse.json({ error: "Unable to analyze this video. Please try another link." }, { status: 500 });

  } catch (error) {
    console.error("Global Error:", error);
    return NextResponse.json({ error: "Unable to analyze this video. Please try another link." }, { status: 500 });
  }
}


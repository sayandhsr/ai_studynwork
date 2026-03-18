import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * BULLETPROOF YOUTUBE SUMMARIZER V5
 * Logic: Strictly Sequential Fallback
 * No early returns on failure.
 */

function extractVideoId(url: string) {
  try {
    const parsed = new URL(url);

    // youtu.be format (e.g. youtu.be/VIDEO_ID?si=...)
    if (parsed.hostname === "youtu.be" || parsed.hostname === "www.youtu.be") {
      return parsed.pathname.slice(1).split("?")[0].split("&")[0];
    }

    // youtube.com format (e.g. youtube.com/watch?v=VIDEO_ID)
    if (parsed.searchParams.get("v")) {
      return parsed.searchParams.get("v");
    }

    // shorts (e.g. youtube.com/shorts/VIDEO_ID)
    if (parsed.pathname.includes("/shorts/")) {
      return parsed.pathname.split("/shorts/")[1].split("?")[0].split("&")[0];
    }

    // embed (e.g. youtube.com/embed/VIDEO_ID)
    if (parsed.pathname.includes("/embed/")) {
      return parsed.pathname.split("/embed/")[1].split("?")[0].split("&")[0];
    }

    // live (e.g. youtube.com/live/VIDEO_ID)
    if (parsed.pathname.includes("/live/")) {
      return parsed.pathname.split("/live/")[1].split("?")[0].split("&")[0];
    }

    return null;
  } catch {
    return null;
  }
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
    console.log("Video ID:", videoId)

    // VALIDATION: Ensure the result has length between 10–15 characters
    if (url && (!videoId || videoId.length < 10 || videoId.length > 15)) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 })
    }

    if (!videoId && !manualTranscript) return NextResponse.json({ error: "Input required" }, { status: 400 })

    // --- CACHE CHECK ---
    if (videoId) {
      const { data: cached } = await supabase.from("yt_summaries")
        .select("summary, mode_used").eq("video_id", videoId).maybeSingle();
      if (cached?.summary) return NextResponse.json({ summary: cached.summary, mode_used: cached.mode_used, cached: true });
    }

    let transcript = null;
    let audioTranscript = null;
    let metadata = null;

    // --- 1. TRANSCRIPT STEP ---
    if (!manualTranscript && videoId && rapidKey) {
      try {
        const res = await fetch(`https://youtube-transcript3.p.rapidapi.com/api/transcript-with-timestamps?video_id=${videoId}`, {
          headers: { "x-rapidapi-key": rapidKey },
          signal: AbortSignal.timeout(6000)
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.transcript)) {
            transcript = data.transcript.map((s: any) => s.text).join(" ");
            console.log("Transcript length:", transcript?.length)
            
            if (transcript && transcript.length > 50) {
              const summary = await synthesize(transcript, "transcript", orKey!);
              if (summary) {
                await supabase.from("yt_summaries").insert([{ user_id: user.id, video_url: url, video_id: videoId, summary, transcript, mode_used: "transcript" }]);
                return NextResponse.json({ summary, mode_used: "transcript" });
              }
            }
          }
        }
      } catch (err) {
        console.log("Transcript failed:", err);
      }
    } else if (manualTranscript) {
      transcript = manualTranscript; // Handle manual entry
      const summary = await synthesize(transcript, "transcript", orKey!);
      if (summary) {
        await supabase.from("yt_summaries").insert([{ user_id: user.id, video_url: "Manual", summary, transcript, mode_used: "manual" }]);
        return NextResponse.json({ summary, mode_used: "manual" });
      }
    }

    // --- 2. AUDIO STEP (MUST ALWAYS RUN IF T1 FAILS) ---
    if (videoId && rapidKey) {
      console.log("Triggering audio fallback")
      try {
        const aiRes = await fetch(`https://youtube-transcripts.p.rapidapi.com/transcript?url=https://www.youtube.com/watch?v=${videoId}`, {
          headers: { "x-rapidapi-key": rapidKey },
          signal: AbortSignal.timeout(20000)
        });
        if (aiRes.ok) {
          const aidata = await aiRes.json();
          audioTranscript = aidata.content || aidata.transcript || "";
          console.log("Audio transcript length:", audioTranscript?.length)
          
          if (audioTranscript && audioTranscript.length > 50) {
            const summary = await synthesize(audioTranscript, "audio", orKey!);
            if (summary) {
              await supabase.from("yt_summaries").insert([{ user_id: user.id, video_url: url, video_id: videoId, summary, transcript: audioTranscript, mode_used: "audio" }]);
              return NextResponse.json({ summary, mode_used: "audio" });
            }
          }
        }
      } catch (err) {
        console.log("Audio failed:", err);
      }
    }

    // --- 3. METADATA STEP (MUST ALWAYS RUN IF T2 FAILS) ---
    if (videoId) {
      console.log("Triggering metadata fallback")
      try {
        const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (res.ok) {
          metadata = await res.json();
          console.log("Metadata:", metadata)
          
          if (metadata && metadata.title) {
            const summary = await synthesize("", "metadata", orKey!, { title: metadata.title, description: metadata.author_name });
            if (summary) {
              await supabase.from("yt_summaries").insert([{ user_id: user.id, video_url: url, video_id: videoId, summary, mode_used: "metadata" }]);
              return NextResponse.json({ summary, mode_used: "metadata" });
            }
          }
        }
      } catch (err) {
        console.log("Metadata failed:", err);
      }
    }

    // --- FINAL FAILSAFE ---
    return NextResponse.json({ error: "Unable to analyze this video. Please try another link." }, { status: 500 });

  } catch (error) {
    console.error("Global Fatal Error:", error);
    return NextResponse.json({ error: "Unable to analyze this video. Please try another link." }, { status: 500 });
  }
}

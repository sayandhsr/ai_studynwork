import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { YoutubeTranscript } from 'youtube-transcript'
import { getSubtitles } from 'youtube-caption-extractor'
// @ts-ignore
import { YoutubeTranscript as YTPlay } from '@playzone/youtube-transcript'

// --- HELPERS (User Version) ---

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body.url || body.videoUrl || "";
    const level = body.level || "detailed"; // brief, detailed, actionable
    const orKey = process.env.OPENROUTER_API_KEY;
    const rapidKey = process.env.RAPIDAPI_KEY;

    if (!url && !body.manualTranscript) {
      return NextResponse.json({ error: "No URL or transcript provided" }, { status: 400 });
    }

    let transcriptText = body.manualTranscript || "";
    let videoId = null;

    if (url && !transcriptText) {
      // ✅ Extract video ID
      const match = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([^&?#/]+)/);
      videoId = match ? match[1] : null;

      if (!videoId) {
        return NextResponse.json({
          summary: "Title: Invalid Video\nSummary: Could not extract video ID from the URL provided.\nKey Points:\n• Please check the link format.\n• Example: youtube.com/watch?v=...",
          v: "8.1"
        });
      }

      // ✅ Get transcript (RapidAPI)
      if (rapidKey) {
        try {
          const transcriptRes = await fetch(
            `https://youtube-transcript3.p.rapidapi.com/api/transcript?videoId=${videoId}`,
            {
              headers: {
                "X-RapidAPI-Key": rapidKey,
                "X-RapidAPI-Host": "youtube-transcript3.p.rapidapi.com",
              },
              signal: AbortSignal.timeout(15000)
            }
          );

          if (transcriptRes.ok) {
            const data = await transcriptRes.json();
            transcriptText = data?.transcript
              ?.map((t: any) => t.text)
              .join(" ");
          }
        } catch (e) { 
          console.log("RapidAPI transcript failed, falling back..."); 
        }
      }

      // ✅ Native Fallback
      if (!transcriptText || transcriptText.length < 50) {
        try {
          const t1 = await YoutubeTranscript.fetchTranscript(videoId);
          if (t1) transcriptText = t1.map(t => t.text).join(" ");
        } catch (e) {}
      }

      // ✅ Last Resort Fallback
      if (!transcriptText || transcriptText.length < 50) {
        transcriptText = `[CRITICAL: NO TRANSCRIPT] Summarize the likely content of this video based ONLY on its URL and any metadata you can infer: ${url}. If you cannot be certain, explain the likely topics based on common YouTube video patterns for similar URLs.`;
      }
    }

    // ✅ Tiered Prompts
    const prompts: Record<string, string> = {
      brief: "Provide a concise, high-level summary. Focus on the core message and primary takeaways in under 150 words.",
      detailed: "Provide a comprehensive analysis. Include the main narrative, supporting arguments, and nuanced details. Aim for a thorough synthesis.",
      actionable: "Focus on practical application. Extract every specific step, tool, checklist, or piece of advice mentioned. Structure it as a guide."
    };

    const selectedPrompt = prompts[level] || prompts.detailed;

    // ✅ CALL OPENROUTER
    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${orKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ai-studynwork.vercel.app",
        "X-Title": "Spurce Sanctuary"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "system",
            content: `You are Spurce AI, an elite intellectual synthesizer. Your goal is to distill video content into premium-grade reports.
            
            Always return the response in this exact format:
            Title: (Professional High-End Title)
            Summary: (A cohesive paragraph reflecting the requested depth)
            Key Points:
            • (Point 1)
            • (Point 2)
            • (Point 3)
            • (Point 4)
            • (Point 5)`
          },
          {
            role: "user",
            content: `${selectedPrompt}\n\nContent to synthesize:\n${transcriptText.substring(0, 25000)}`
          },
        ],
      }),
      signal: AbortSignal.timeout(45000)
    });

    const aiData = await aiRes.json();
    const output = aiData?.choices?.[0]?.message?.content || "Spurce AI Error: The synthesis engine failed to resolve. Check credits or connection.";

    // ✅ DB Cache
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && output.length > 50) {
        await supabase.from("yt_summaries").upsert([{ 
          user_id: user.id, 
          video_id: videoId || `manual-${Date.now()}`, 
          video_url: url || "Manual Paste",
          summary: output, 
          mode_used: `Spurce-v30-${level}`
        }]);
      }
    } catch (e) {}

    return NextResponse.json({
      summary: output,
      v: "30.5",
      debug: `Engine: Gemini-2.0-Flash | Mode: Tiered-${level} | Trace: SPURCE_ENHANCED_ACTIVE`
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({
      summary: `Title: Synthesis Interruption (v30.5)\nSummary: ${err?.message || "The analytical engine encountered a critical path failure."}\nKey Points:\n• Network latency exceedance.\n• API quota or rate limiting.\n• Trace: SPURCE_FAIL_30.5`,
      v: "30.5"
    });
  }
}

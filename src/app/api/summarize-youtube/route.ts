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
    const orKey = process.env.OPENROUTER_API_KEY;
    const rapidKey = process.env.RAPIDAPI_KEY;

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    // ✅ Extract video ID
    const match = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([^&?#/]+)/);
    const videoId = match ? match[1] : null;

    if (!videoId) {
      return NextResponse.json({
        summary: "Title: Invalid Video\nSummary: Could not extract video ID from the URL provided.\nKey Points:\n• Please check the link format.\n• Example: youtube.com/watch?v=...",
        v: "8.1"
      });
    }

    // ✅ Get transcript (RapidAPI)
    let transcriptText = "";
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

    // ✅ Native Fallback (Just in case)
    if (!transcriptText || transcriptText.length < 50) {
       try {
         const t1 = await YoutubeTranscript.fetchTranscript(videoId);
         if (t1) transcriptText = t1.map(t => t.text).join(" ");
       } catch (e) {}
    }

    // ✅ Last Resort Fallback (User Logic)
    if (!transcriptText || transcriptText.length < 50) {
      transcriptText = `Summarize this YouTube video based on its URL: ${url}. Provide a high-level educational summary and key takeaways if no transcript is available.`;
    }

    // ✅ CALL OPENROUTER (User Request)
    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${orKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ai-studynwork.vercel.app",
        "X-Title": "Spurce Sanctuary"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: [
          {
            role: "user",
            content: `Summarize this content:

${transcriptText.substring(0, 15000)}

Return:
Title: (Professional Video Title)
Summary: (Concise paragraph)
Key Points: (Exactly 5 bullet points starting with •)
`,
          },
        ],
      }),
      signal: AbortSignal.timeout(40000)
    });

    const aiData = await aiRes.json();
    const output = aiData?.choices?.[0]?.message?.content || "Spurce AI Error: Failed to generate summary. Please check your OpenRouter credits/balance.";

    // ✅ DB Cache (Optional but good)
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && output.length > 50) {
        await supabase.from("yt_summaries").upsert([{ 
          user_id: user.id, 
          video_id: videoId, 
          video_url: url,
          summary: output, 
          mode_used: "User-Simple-v8.1"
        }], { onConflict: 'video_id' });
      }
    } catch (e) {}

    // ✅ RETURN CLEAN RESPONSE (Spurce Edition)
    return NextResponse.json({
      summary: output,
      v: "30.1",
      debug: "Engine: Spurce-v8 | Mode: User-DeepSeek | Trace: SPURCE_USER_ACTIVE"
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({
      summary: `Title: Synthesis Error (v30.1)\nSummary: ${err?.message || "The backend encountered an execution error."}\nKey Points:\n• Network timeout or invalid API response.\n• Trace: SPURCE_FAIL_30.1`,
      v: "30.1"
    });
  }
}

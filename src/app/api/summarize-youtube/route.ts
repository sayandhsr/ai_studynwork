import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

async function fetchTranscript(vId: string, apiKey: string) {
  const url = `https://youtube-transcripts.p.rapidapi.com/transcript?videoId=${vId}&mode=auto`;
  console.log(`[V22] Attempting transcript for ${vId}...`);
  try {
    const res = await fetch(url, {
      headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": "youtube-transcripts.p.rapidapi.com" },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) {
      console.log(`[V22] Transcript API blocked (e.g. not subscribed): Status ${res.status}`);
      return null;
    }
    const data = await res.json();
    return data.content || data.transcript || null;
  } catch (e) { return null; }
}

async function fetchYoutubeMetadata(vId: string) {
  console.log(`[V22] EMERGENCY FALLBACK: Directly fetching YouTube metadata for ${vId}`);
  try {
    // Attempt 1: Direct HTML scrape
    const res = await fetch(`https://www.youtube.com/watch?v=${vId}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      signal: AbortSignal.timeout(10000)
    });
    if (res.ok) {
      const html = await res.text();
      const titleMatch = html.match(/<title>(.*?)<\/title>/);
      const descMatch = html.match(/\"shortDescription\":\"(.*?)\"/);
      
      const title = titleMatch ? titleMatch[1].replace(" - YouTube", "") : "";
      const description = descMatch ? descMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"') : "";
      
      if (title || description) {
        return `Video Title: ${title}\n\nVideo Description/Context:\n${description}`;
      }
    }
  } catch(e) {}
  
  try {
    // Attempt 2: Oembed API
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vId}&format=json`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      return `Video Title: ${data.title}\nAuthor: ${data.author_name}`;
    }
  } catch(e) {}
  
  return null;
}

async function synthesize(content: string, orKey: string, geminiKey?: string) {
  const prompt = `Summarize the following video context clearly and naturally. It may be a transcript or a description.

Return EXACTLY:
Title: (create a good title)
Summary: (concise 2-3 sentence summary)
Key Points:
• (point 1)
• (point 2)
• (point 3)

Do NOT ask for a transcript. Do NOT invent information. Extract the best insights possible from the provided context.`;

  // --- STRATEGY 1: NATIVE GEMINI (PRIMARY) ---
  if (geminiKey) {
    try {
      console.log("[V22] Attempting Native Gemini Synthesis...")
      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: `Instructions: ${prompt}\n\nContent:\n${content.substring(0, 10000)}` }] }]
        }),
        signal: AbortSignal.timeout(20000)
      })

      if (res.ok) {
        const data = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (text && text.length > 50) return text.replace(/[*#`]/g, "").trim()
      }
    } catch (e) {
      console.error("[V22] Gemini Native Failed:", e)
    }
  }

  // --- STRATEGY 2: OPENROUTER FAILBACK ---
  const models = [
    "deepseek/deepseek-chat", 
    "x-ai/grok-2-latest", 
    "mistralai/mixtral-8x7b-instruct",
    "google/gemini-2.0-flash-lite-preview-02-05:free",
    "mistralai/mistral-7b-instruct:free"
  ];
  const banned = ["no transcript", "cannot summarize", "please provide", "unavailable", "missing data", "placeholder", "metadata-based analysis"];

  for (const model of models) {
    try {
      if (!orKey) continue;
      console.log(`[V22] Synthesizing via ${model}...`);
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${orKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You are an expert video analyzer. Output ONLY the Title, Summary, and Key Points as requested." },
            { role: "user", content: `Instructions: ${prompt}\n\nVideo Context:\n${content.substring(0, 5000)}` }
          ]
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (!res.ok) continue;
      const data = await res.json();
      const text = (data.choices?.[0]?.message?.content || "").replace(/[*#`]/g, "").trim();

      if (text && text.length > 50 && !banned.some(b => text.toLowerCase().includes(b))) {
        return text;
      }
    } catch (e) { console.log(`[V22] Synthesis error on ${model}.`); }
  }

  // FINAL PRODUCTION FAILSAFE
  const titleFallback = content.split('\n')[0].replace('Video Title:', '').trim() || 'YouTube Video';
  const descFallback = content.substring(0, 500).replace(/\n/g, ' ') || 'No description available.';
  return `Title: ${titleFallback}\nSummary: ${descFallback}...\nKey Points:\n• Highlight pulled from video context\n• Extended AI synthesis currently unavailable\n• Please verify API credits`;
}

// --- MAIN ROUTE ---

export async function POST(req: Request) {
  try {
    const { url, manualTranscript } = await req.json();
    const rapidKey = process.env.RAPIDAPI_KEY!;
    const orKey = process.env.OPENROUTER_API_KEY!;
    
    if (!url && !manualTranscript) {
       return NextResponse.json({ summary: "Title: Initialization\nSummary: Please provide a YouTube link to begin analysis.\nKey Points:\n• Awaiting user input" });
    }

    const vId = url ? (extractVideoId(url) || "unknown") : "manual";
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let finalContent = manualTranscript || "";
    let modeUsed = manualTranscript ? "Manual" : "Native";

    // 1. TRY TRANSCRIPT
    if (!finalContent && vId !== "unknown") {
      const transcript = await fetchTranscript(vId, rapidKey);
      if (transcript && transcript.length > 50) {
        finalContent = transcript;
        modeUsed = "Transcript (Auto)";
      }
    }

    // 2. EMERGENCY METADATA SCRAPE (If transcript API fails/unsubscribed)
    if (!finalContent && vId !== "unknown") {
       const metadata = await fetchYoutubeMetadata(vId);
       if (metadata && metadata.length > 10) {
         finalContent = metadata;
         modeUsed = "Direct Web Scrape";
       }
    }

    // 3. ABSOLUTE LAST RESORT
    if (!finalContent || finalContent.length < 10) {
      console.log("[V22] Total failure. Falling back to video ID context.");
      finalContent = `Video ID: ${vId}. Please synthesize a descriptive overview of what a video with this URL might entail based on standard YouTube formats.`;
      modeUsed = "Safety Fallback";
    }

    // 3. SYNTHESIZE
    const summary = await synthesize(finalContent, orKey, process.env.GEMINI_API_KEY);

    // 5. DB SAVE
    if (user && summary.length > 50) {
      try {
        await supabase.from("yt_summaries").upsert([{ 
          user_id: user.id, 
          video_id: vId, 
          video_url: url || "",
          summary, 
          mode_used: modeUsed 
        }], { onConflict: 'video_id' });
        
        const titleMatch = summary.match(/Title:\s*(.*)/i);
        const noteTitle = titleMatch ? titleMatch[1].trim() : `Report: ${vId}`;
        await supabase.from("notes").insert([{ user_id: user.id, title: noteTitle, content: summary }]);
      } catch (e) { console.log("[V22] DB save skipped."); }
    }

    return NextResponse.json({ summary, mode_used: modeUsed });

  } catch (error) {
    console.error("[V22] Critical API Error:", error);
    return NextResponse.json({ summary: "Title: API Offline\nSummary: The backend encountered a severe execution error.\nKey Points:\n• Please try again." });
  }
}

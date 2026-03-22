import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { YoutubeTranscript } from 'youtube-transcript'

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

async function fetchTranscript(vId: string) {
  console.log(`Attempting transcript fetch for ${vId}...`);
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(vId);
    return transcript.map(t => t.text).join(" ");
  } catch (e) {
    console.error(`Transcript fetch failed for ${vId}:`, e);
    return null;
  }
}

async function fetchYoutubeMetadata(vId: string) {
  console.log(`Fallback: Fetching YouTube metadata for ${vId}`);
  try {
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
        return `Video Title: ${title}\n\nVideo Description:\n${description}`;
      }
    }
  } catch(e) {}
  return null;
}

async function synthesize(content: string, orKey: string, geminiKey?: string) {
  const prompt = `Perform a deep analysis of the following video content. Provide a professional, meaningful summary and key insights.
  
Return EXACTLY in this format:
Title: (Professional Video Title)
Summary: (Comprehensive 3-5 sentence summary of the core concepts)
Key Points:
• (Insightful point 1)
• (Insightful point 2)
• (Insightful point 3)
• (Insightful point 4)
• (Insightful point 5)

Analyze the tone, core message, and specific details. Do NOT use placeholder text.`;

  let geminiResults = ""
  if (geminiKey) {
    const geminiAttempts = [
      { model: "gemini-2.0-flash", version: "v1beta" },
      { model: "gemini-1.5-flash", version: "v1" },
      { model: "gemini-1.5-flash", version: "v1beta" }
    ]
    for (const attempt of geminiAttempts) {
      try {
        console.log(`[SYNTH] Trying Gemini: ${attempt.model} (${attempt.version})`)
        const url = `https://generativelanguage.googleapis.com/${attempt.version}/models/${attempt.model}:generateContent?key=${geminiKey}`
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: `Instructions: ${prompt}\n\nContent:\n${content.substring(0, 15000)}` }] }]
          }),
          signal: AbortSignal.timeout(20000)
        })

        if (res.ok) {
          const data = await res.json()
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (text && text.length > 50) {
            console.log(`[SYNTH] Gemini Success with ${attempt.model}`)
            return text.replace(/[*#`]/g, "").trim()
          }
        } else {
          const errText = await res.text()
          console.error(`[SYNTH] Gemini ${attempt.model} Error (Status ${res.status}):`, errText)
          geminiResults += `${attempt.model}: Error ${res.status}. `
        }
      } catch (e: any) {
        console.error(`[SYNTH] Gemini ${attempt.model} Exception:`, e.message)
        geminiResults += `${attempt.model}: ${e.message}. `
      }
    }
  } else {
    geminiResults = "Key is MISSING in Vercel settings. "
  }

  let orResults = ""
  if (orKey) {
    const orModels = [
      "google/gemini-2.0-flash-lite-preview-02-05:free",
      "google/gemini-flash-1.5-exp:free",
      "mistralai/mistral-7b-instruct:free",
      "openchat/openchat-7b:free"
    ];
    for (const model of orModels) {
      try {
        console.log(`[SYNTH] Trying OpenRouter: ${model}`)
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${orKey}`, "Content-Type": "application/json" },
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
             console.log(`[SYNTH] OpenRouter Success with ${model}`)
             return text;
          }
        } else {
           const errText = await res.text()
           console.error(`[SYNTH] OR Error (${model}):`, errText);
           orResults += `${model}: Error ${res.status}. `
        }
      } catch (e: any) {
         console.error(`[SYNTH] OR Exception (${model}):`, e.message);
         orResults += `${model}: ${e.message}. `
      }
    }
  } else {
    orResults = "Key is MISSING in Vercel settings. "
  }

  throw new Error(`Synthesis Failed Details: (Gemini: ${geminiResults}) (OpenRouter: ${orResults})`);
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
      const transcript = await fetchTranscript(vId);
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
      finalContent = `Video ID: ${vId}. Professional analysis based on video identification.`;
      modeUsed = "Safety Fallback";
    }

    // 3. SYNTHESIZE
    const summary = await synthesize(finalContent, orKey, process.env.GEMINI_API_KEY);

    // 5. DB CACHE (Optional, but skip auto-notes)
    if (user && summary.length > 50) {
      try {
        await supabase.from("yt_summaries").upsert([{ 
          user_id: user.id, 
          video_id: vId, 
          video_url: url || "",
          summary, 
          mode_used: modeUsed 
        }], { onConflict: 'video_id' });
      } catch (e) { console.log("DB cache skipped."); }
    }

    return NextResponse.json({ summary, mode_used: modeUsed });

  } catch (error: any) {
    console.error("[V22] Critical API Error:", error);
    const errorMessage = error?.message || "The backend encountered a severe execution error.";
    return NextResponse.json({ summary: `Title: Synthesis Failed\nSummary: ${errorMessage}\nKey Points:\n• Please ensure your API keys have sufficient credits.\n• Only Gemini Flash-Lite and Mistral are configured on OpenRouter.` });
  }
}

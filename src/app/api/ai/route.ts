import { NextResponse } from "next/server";
import { getAuthedStaff } from "@/lib/auth";

const MAX_MESSAGE_CHARS = 4000;
const MAX_CONTEXT_CHARS = 8000;
const MAX_HISTORY_TURNS = 12; // ~6 user/assistant pairs
const MAX_HISTORY_CHARS = 12000;

const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT = 15; // requests per window per staff member

// Best-effort in-process limiter. Per-instance, so a multi-instance deploy
// gives RATE_LIMIT * N — still bounded enough to prevent runaway cost.
const rateBuckets = new Map<string, number[]>();

function takeRateToken(key: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key) ?? [];
  const fresh = bucket.filter((t) => now - t < RATE_WINDOW_MS);
  if (fresh.length >= RATE_LIMIT) {
    rateBuckets.set(key, fresh);
    return false;
  }
  fresh.push(now);
  rateBuckets.set(key, fresh);
  return true;
}

function trimHistory(history: any): Array<{ role: string; content: string }> {
  if (!Array.isArray(history)) return [];
  // Keep only the last MAX_HISTORY_TURNS items, then cap by total chars.
  const tail = history.slice(-MAX_HISTORY_TURNS);
  let used = 0;
  const out: Array<{ role: string; content: string }> = [];
  for (let i = tail.length - 1; i >= 0; i--) {
    const h = tail[i];
    if (typeof h?.content !== "string" || typeof h?.role !== "string") continue;
    const content = h.content.slice(0, 4000);
    if (used + content.length > MAX_HISTORY_CHARS) break;
    used += content.length;
    out.unshift({ role: h.role, content });
  }
  return out;
}

export async function POST(req: Request) {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (staff.role !== "Dentist" && staff.role !== "Admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (!takeRateToken(staff.id))
    return NextResponse.json({ error: "Rate limit exceeded — try again in a minute." }, { status: 429 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured — add GEMINI_API_KEY to .env.local" }, { status: 503 });

  const { message, patientContext, history } = await req.json().catch(() => ({}));
  if (!message || typeof message !== "string")
    return NextResponse.json({ error: "No message" }, { status: 400 });

  const trimmedMessage = message.slice(0, MAX_MESSAGE_CHARS);
  const contextStr = JSON.stringify(patientContext ?? {}, null, 2).slice(0, MAX_CONTEXT_CHARS);
  const trimmedHistory = trimHistory(history);

  const systemPrompt = `You are an AI clinical assistant for Yinlade Clinic, a dental practice in Abuja, Nigeria.
You assist dental professionals with clinical documentation, treatment planning, patient care notes, and clinical decision support.
Be concise, professional, and clinically accurate. Use Nigerian context where relevant (e.g. drug availability, local guidelines).
Always remind the clinician to apply their professional judgment.
Never diagnose or prescribe — support documentation and planning only.

Current patient context:
${contextStr}`;

  const contents = [
    ...trimmedHistory.map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    })),
    { role: "user", parts: [{ text: trimmedMessage }] },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
        }),
        signal: controller.signal,
      },
    );
  } catch (e) {
    clearTimeout(timeout);
    return NextResponse.json({ error: "AI request failed or timed out" }, { status: 504 });
  }
  clearTimeout(timeout);

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    return NextResponse.json({ error: err?.error?.message || "Gemini API error" }, { status: 502 });
  }

  const data = await res.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response from AI.";
  return NextResponse.json({ reply });
}

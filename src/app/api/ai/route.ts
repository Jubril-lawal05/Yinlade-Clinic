import { NextResponse } from "next/server";
import { getAuthedStaff } from "@/lib/auth";

export async function POST(req: Request) {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured — add GEMINI_API_KEY to .env.local" }, { status: 503 });

  const { message, patientContext, history } = await req.json().catch(() => ({}));
  if (!message) return NextResponse.json({ error: "No message" }, { status: 400 });

  const systemPrompt = `You are an AI clinical assistant for Yinlade Clinic, a dental practice in Abuja, Nigeria.
You assist dental professionals with clinical documentation, treatment planning, patient care notes, and clinical decision support.
Be concise, professional, and clinically accurate. Use Nigerian context where relevant (e.g. drug availability, local guidelines).
Always remind the clinician to apply their professional judgment.
Never diagnose or prescribe — support documentation and planning only.

Current patient context:
${JSON.stringify(patientContext ?? {}, null, 2)}`;

  const contents = [
    ...(history ?? []).map((h: { role: string; content: string }) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    return NextResponse.json({ error: err?.error?.message || "Gemini API error" }, { status: 502 });
  }

  const data = await res.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response from AI.";
  return NextResponse.json({ reply });
}

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/firebase-admin";
import { Filter } from "firebase-admin/firestore";
import { getJwtCookieName, signAuthToken } from "@/lib/auth";

const Body = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

function parseMaxAge(expiresIn: string | undefined) {
  if (!expiresIn) return 60 * 60 * 24 * 7;
  const m = expiresIn.match(/^(\d+)([dhm])$/);
  if (!m) return 60 * 60 * 24 * 7;
  const n = Number(m[1]);
  const unit = m[2];
  if (unit === "d") return n * 24 * 60 * 60;
  if (unit === "h") return n * 60 * 60;
  return n * 60;
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const body = Body.safeParse(json);
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  let snap;
  try {
    snap = await db.collection("staff")
      .where(Filter.or(
        Filter.where("email", "==", body.data.email),
        Filter.where("name", "==", body.data.email)
      ))
      .limit(1)
      .get();
  } catch (e) {
    console.error("[login] Firestore error:", e);
    return NextResponse.json({ error: "Database error", detail: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
  if (snap.empty) return NextResponse.json({ error: "Incorrect name, email, or password" }, { status: 401 });


  const doc = snap.docs[0];
  const staff = doc.data();

  const ok = await bcrypt.compare(body.data.password, staff.passwordHash);
  if (!ok) return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });

  const token = signAuthToken({ sub: doc.id, role: staff.role, name: staff.name });

  const res = NextResponse.json({
    user: { id: doc.id, name: staff.name, role: staff.role, email: staff.email, avatar: staff.avatar },
  });

  const maxAge = parseMaxAge(process.env.JWT_EXPIRES_IN);
  res.cookies.set(getJwtCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge,
  });

  return res;
}

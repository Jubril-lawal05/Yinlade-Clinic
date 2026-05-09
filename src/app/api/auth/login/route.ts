import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/firebase-admin";
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

  const identifier = body.data.email.trim();

  let doc;
  try {
    const byEmail = await db.collection("staff").where("email", "==", identifier).limit(1).get();
    if (!byEmail.empty) {
      doc = byEmail.docs[0];
    } else {
      const byName = await db.collection("staff").where("name", "==", identifier).limit(1).get();
      if (!byName.empty) doc = byName.docs[0];
    }
  } catch (e) {
    console.error("[login] Firestore error");
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!doc) return NextResponse.json({ error: "Incorrect name, email, or password" }, { status: 401 });

  const staff = doc.data();
  const ok = await bcrypt.compare(body.data.password, staff.passwordHash);
  if (!ok) return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });

  const token = signAuthToken({
    sub: doc.id,
    role: staff.role,
    name: staff.name,
    email: staff.email || "",
    avatar: staff.avatar || "",
  });

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

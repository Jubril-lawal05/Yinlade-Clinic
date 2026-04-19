import { sign, verify } from "jsonwebtoken";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "./firebase-admin";

const JwtPayload = z.object({
  sub: z.string(),
  role: z.string(),
  name: z.string(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export type AuthedStaff = {
  id: string;
  name: string;
  role: "Dentist" | "Admin" | "Nurse";
  email: string;
  avatar: string;
};

export function getJwtCookieName() {
  return process.env.COOKIE_NAME || "clinic_portal_token";
}

export function signAuthToken(payload: { sub: string; role: string; name: string }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured.");
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return sign(payload as any, secret as any, { expiresIn } as any);
}

export async function getAuthedStaff(): Promise<AuthedStaff | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured.");

  const cookieStore = await cookies();
  const token = cookieStore.get(getJwtCookieName())?.value;
  if (!token) return null;

  try {
    const decoded = verify(token, secret);
    const parsed = JwtPayload.parse(decoded);

    const doc = await db.collection("staff").doc(parsed.sub).get();
    if (!doc.exists) return null;

    const s = doc.data()!;
    return { id: doc.id, name: s.name, role: s.role, email: s.email, avatar: s.avatar };
  } catch {
    return null;
  }
}

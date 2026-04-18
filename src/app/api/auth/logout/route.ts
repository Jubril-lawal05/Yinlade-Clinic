import { NextResponse } from "next/server";
import { getJwtCookieName } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(getJwtCookieName(), "", { path: "/", maxAge: 0 });
  return res;
}


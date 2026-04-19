import { NextResponse } from "next/server";

export async function GET() {
  const hasSA = !!process.env.FIREBASE_SERVICE_ACCOUNT;
  const hasJWT = !!process.env.JWT_SECRET;

  let parseOk = false;
  let parseError = "";
  let dbOk = false;
  let dbError = "";

  if (hasSA) {
    try {
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
      parseOk = true;
    } catch (e) {
      parseError = e instanceof Error ? e.message : String(e);
    }
  }

  if (parseOk) {
    try {
      const { db } = await import("@/lib/firebase-admin");
      await db.collection("staff").limit(1).get();
      dbOk = true;
    } catch (e) {
      dbError = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json({ hasSA, hasJWT, parseOk, parseError, dbOk, dbError });
}

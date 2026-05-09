import { NextResponse } from "next/server";

export async function GET() {
  const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT;
  const hasSplitCreds =
    !!process.env.FIREBASE_PROJECT_ID &&
    !!process.env.FIREBASE_CLIENT_EMAIL &&
    !!process.env.FIREBASE_PRIVATE_KEY;
  const hasJWT = !!process.env.JWT_SECRET;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const cookieName = process.env.COOKIE_NAME || "clinic_portal_token";

  let credentialsParseable = false;
  let credentialsParseError = "";
  if (hasServiceAccount) {
    try {
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);
      credentialsParseable = true;
    } catch (e) {
      credentialsParseError = e instanceof Error ? e.message : String(e);
    }
  } else if (hasSplitCreds) {
    credentialsParseable = true;
  }

  let dbReachable = false;
  let dbError = "";
  if (credentialsParseable) {
    try {
      const { db } = await import("@/lib/firebase-admin");
      await db.collection("staff").limit(1).get();
      dbReachable = true;
    } catch (e) {
      dbError = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json({
    env: {
      hasServiceAccount,
      hasSplitCreds,
      hasJWT,
      hasGemini,
      cookieName,
    },
    credentialsParseable,
    credentialsParseError,
    dbReachable,
    dbError,
  });
}

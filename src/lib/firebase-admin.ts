import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

function getAdminApp() {
  if (getApps().length > 0) return getApp();

  // Prefer full JSON service account (most reliable on Vercel)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      return initializeApp({ credential: cert(sa) });
    } catch (e) {
      throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Fallback: individual env vars
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawKey) {
    throw new Error(`Missing Firebase credentials: projectId=${!!projectId} clientEmail=${!!clientEmail} privateKey=${!!rawKey}`);
  }

  const privateKey = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey;

  try {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  } catch (e) {
    throw new Error(`Firebase init failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export function getDb() {
  return getFirestore(getAdminApp());
}

export { FieldValue, Timestamp };

export function tsToYMD(ts: any): string {
  if (!ts) return "";
  try {
    const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export const db = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});

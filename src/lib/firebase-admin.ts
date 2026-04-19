import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

let _db: ReturnType<typeof getFirestore> | null = null;

function getAdminDb() {
  if (_db) return _db;

  if (getApps().length === 0) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        initializeApp({ credential: cert(sa) });
      } catch (e) {
        throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT: ${e instanceof Error ? e.message : String(e)}`);
      }
    } else {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const rawKey = process.env.FIREBASE_PRIVATE_KEY;
      if (!projectId || !clientEmail || !rawKey)
        throw new Error(`Missing Firebase credentials`);
      const privateKey = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey;
      initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    }
  }

  _db = getFirestore(getApp());
  _db.settings({ ignoreUndefinedProperties: true });
  return _db;
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
    return (getAdminDb() as any)[prop];
  },
});

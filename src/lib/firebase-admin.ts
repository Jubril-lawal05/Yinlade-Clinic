import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

function getAdminApp() {
  if (getApps().length > 0) return getApp();
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your environment."
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
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

// Seed counters/patient with the highest existing displayId number, so the new
// transactional ID allocator starts at the right value.
//
// Run once after deploying the patients/route.ts change:
//   node scripts/backfill-counter.mjs
//
// Safe to re-run; takes max(currentValue, scannedMax).
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.local") });

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();
const PATIENT_COUNTER_SEED = 4949;

async function main() {
  console.log("Scanning patient displayIds…");
  const snap = await db.collection("patients").get();
  let maxNum = PATIENT_COUNTER_SEED;
  let scanned = 0;
  for (const d of snap.docs) {
    const id = d.data().displayId;
    if (!id) continue;
    const m = String(id).match(/^(\d+)\/\d{2}\/\d{4}$/);
    if (!m) continue;
    const n = parseInt(m[1], 10);
    if (n > maxNum) maxNum = n;
    scanned++;
  }
  console.log(`  Scanned ${snap.size} patients, ${scanned} with parseable displayId.`);

  const counterRef = db.collection("counters").doc("patient");
  const cur = await counterRef.get();
  const curValue = cur.exists ? Number(cur.data()?.value || 0) : 0;
  const next = Math.max(curValue, maxNum);

  console.log(`  Current counter: ${curValue}, scanned max: ${maxNum}, setting to: ${next}`);
  await counterRef.set({ value: next, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

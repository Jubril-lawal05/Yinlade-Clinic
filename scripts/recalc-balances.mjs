// Recompute every patient's balance from the source of truth (their invoices).
// Run once after deploying the new transactional invoice/payment routes:
//   node scripts/recalc-balances.mjs
// Idempotent. Safe to re-run.
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
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

function num(x) {
  if (x == null) return 0;
  if (typeof x === "number") return x;
  if (typeof x === "string") return Number(x) || 0;
  if (typeof x?.toNumber === "function") return x.toNumber();
  return Number(x) || 0;
}

async function main() {
  console.log("Loading invoices…");
  const invSnap = await db.collection("invoices").get();
  const balByPatient = new Map();
  for (const d of invSnap.docs) {
    const i = d.data();
    const owed = num(i.total) - num(i.paid);
    balByPatient.set(i.patientId, (balByPatient.get(i.patientId) || 0) + owed);
  }

  console.log("Loading patients…");
  const patSnap = await db.collection("patients").get();
  console.log(`  ${patSnap.size} patients, ${invSnap.size} invoices.`);

  let updated = 0;
  let unchanged = 0;
  let batch = db.batch();
  let batchOps = 0;

  for (const d of patSnap.docs) {
    const computed = Math.round((balByPatient.get(d.id) || 0) * 100) / 100;
    const current = Math.round(num(d.data().balance) * 100) / 100;
    if (computed === current) { unchanged++; continue; }
    batch.update(d.ref, { balance: computed });
    batchOps++;
    updated++;
    if (batchOps >= 450) {
      await batch.commit();
      batch = db.batch();
      batchOps = 0;
    }
  }
  if (batchOps > 0) await batch.commit();

  console.log(`Done. Updated: ${updated}, unchanged: ${unchanged}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

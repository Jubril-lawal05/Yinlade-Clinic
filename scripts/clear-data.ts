/**
 * Clear all demo/fake data from Firestore.
 * Keeps staff accounts intact so users can still log in.
 *
 * Usage: npx tsx scripts/clear-data.ts
 */

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";
import * as path from "path";

// Load env
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Init Firebase Admin
if (getApps().length === 0) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(sa) });
  } else {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!projectId || !clientEmail || !rawKey) {
      console.error("❌ Missing Firebase credentials in .env.local or .env");
      process.exit(1);
    }
    const privateKey = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey;
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }
}

const db = getFirestore();

async function deleteCollection(name: string) {
  const snap = await db.collection(name).get();
  if (snap.empty) {
    console.log(`  ✓ ${name}: already empty`);
    return 0;
  }

  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`  ✓ ${name}: deleted ${snap.size} documents`);
  return snap.size;
}

async function main() {
  console.log("\n🧹 Clearing all demo data from Firestore...\n");
  console.log("⚠️  Staff accounts will be KEPT so users can still log in.\n");

  // Collections to clear (order matters — delete children first)
  const collections = [
    "treatmentNotes",
    "clinicalRecords",
    "invoiceItems",
    "invoices",
    "appointments",
    "tasks",
    "messages",
    "patients",
  ];

  let total = 0;
  for (const col of collections) {
    total += await deleteCollection(col);
  }

  console.log(`\n✅ Done! Deleted ${total} total documents.`);
  console.log("ℹ️  Staff accounts preserved — users can still log in.");
  console.log("🎉 The clinic app is now ready for live use!\n");
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});

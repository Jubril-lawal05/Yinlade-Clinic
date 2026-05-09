// Deploy composite indexes via the Firestore Admin REST API using the SA in .env.local.
// Bypasses `firebase deploy`'s serviceusage.googleapis.com permission check.
//
// Run: node scripts/deploy-indexes.mjs
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { initializeApp, cert, getApps } from "firebase-admin/app";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.local") });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing FIREBASE_* env vars in .env.local");
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

async function getAccessToken() {
  const app = getApps()[0];
  const cred = app.options.credential;
  const tok = await cred.getAccessToken();
  return tok.access_token;
}

const indexesPath = resolve(__dirname, "../firestore.indexes.json");
const config = JSON.parse(readFileSync(indexesPath, "utf8"));

function fieldsToBody(fields) {
  return fields.map((f) => {
    const out = { fieldPath: f.fieldPath };
    if (f.order) out.order = f.order;
    if (f.arrayConfig) out.arrayConfig = f.arrayConfig;
    return out;
  });
}

async function main() {
  const token = await getAccessToken();
  console.log(`Project: ${projectId}, deploying ${config.indexes.length} composite index(es)…\n`);

  let created = 0;
  let already = 0;
  let failed = 0;

  for (const idx of config.indexes) {
    const collectionGroup = idx.collectionGroup;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/collectionGroups/${collectionGroup}/indexes`;
    const body = {
      queryScope: idx.queryScope || "COLLECTION",
      fields: fieldsToBody(idx.fields),
    };

    const fieldDesc = idx.fields.map((f) => `${f.fieldPath}:${f.order || f.arrayConfig}`).join(",");
    const label = `${collectionGroup} (${fieldDesc})`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`✓ Created  ${label}`);
      console.log(`           name: ${data.name || "(building)"}`);
      created++;
    } else {
      const errText = await res.text();
      let parsed;
      try { parsed = JSON.parse(errText); } catch { parsed = { error: { message: errText } }; }
      const msg = parsed.error?.message || errText;
      const code = parsed.error?.code || res.status;

      if (res.status === 409 || /already exists/i.test(msg)) {
        console.log(`= Exists   ${label}`);
        already++;
      } else {
        console.log(`✗ Failed   ${label}`);
        console.log(`           [${code}] ${msg}`);
        failed++;
      }
    }
  }

  console.log(`\nSummary: ${created} created, ${already} already existed, ${failed} failed.`);
  if (created > 0)
    console.log("Note: index builds run server-side and may take a few minutes to become available.");
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

require("dotenv").config({ path: ".env.local" });
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawKey = process.env.FIREBASE_PRIVATE_KEY;
const privateKey = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey;
initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });

const db = getFirestore();
db.collection("patients").limit(5).get().then(snap => {
  snap.forEach(d => console.log(d.id, d.data().name, "Display ID:", d.data().displayId));
}).catch(console.error);

// Run: node scripts/firebase-seed.mjs
// Requires env: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env.local") });

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

const db = getFirestore();

async function clearAll() {
  const cols = ["staff", "patients", "clinicalRecords", "treatmentNotes", "appointments", "invoices", "payments", "tasks", "messages"];
  for (const col of cols) {
    const snap = await db.collection(col).get();
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    console.log(`  Cleared ${col} (${snap.size} docs)`);
  }
}

async function main() {
  console.log("Clearing existing data…");
  await clearAll();

  console.log("\nSeeding staff…");
  const staffSeed = [
    { name: "Dr Adeyinka Lawal", role: "Dentist", email: "doctor@yinlade.ng", password: "doctor123", avatar: "AL" },
    { name: "Kemi Adebayo",      role: "Admin",   email: "admin@yinlade.ng",  password: "admin123",  avatar: "KA" },
    { name: "Nurse Bola",        role: "Nurse",   email: "nurse@yinlade.ng",  password: "nurse123",  avatar: "NB" },
  ];

  const staffIds = {};
  for (const s of staffSeed) {
    const passwordHash = await bcrypt.hash(s.password, 10);
    const ref = await db.collection("staff").add({
      name: s.name, role: s.role, email: s.email, passwordHash, avatar: s.avatar,
      createdAt: FieldValue.serverTimestamp(),
    });
    staffIds[s.name] = ref.id;
    console.log(`  ${s.name} → ${ref.id}`);
  }
  const doctorId = staffIds["Dr Adeyinka Lawal"];

  console.log("\nSeeding patients…");
  const patientsSeed = [
    { key: "P001", name: "Amaka Okonkwo",  dob: "1988-03-14", phone: "08031234567", email: "amaka@email.com",  address: "Wuse 2, Abuja",   blood: "O+",  allergies: "Penicillin", balance: 15000, status: "active",   gender: "Female", job: "Teacher",       medical: "Hypertension", smoker: "No",  alcohol: "None" },
    { key: "P002", name: "Emeka Chukwu",   dob: "1975-07-22", phone: "08056789012", email: "emeka@email.com",  address: "Garki, Abuja",     blood: "A+",  allergies: "None",      balance: 0,     status: "active",   gender: "Male",   job: "Civil Servant", medical: "None",         smoker: "Yes", alcohol: "Occasional" },
    { key: "P003", name: "Fatima Al-Hassan",dob: "1995-11-08", phone: "08098765432", email: "fatima@email.com", address: "Maitama, Abuja",   blood: "B+",  allergies: "Latex",     balance: 8500,  status: "active",   gender: "Female", job: "Lawyer",        medical: "Asthma",       smoker: "No",  alcohol: "None" },
    { key: "P004", name: "Chidi Nwosu",    dob: "1982-05-30", phone: "07012345678", email: "chidi@email.com",  address: "Asokoro, Abuja",   blood: "AB+", allergies: "None",      balance: 25000, status: "inactive", gender: "Male",   job: "Engineer",      medical: "Diabetes T2",  smoker: "No",  alcohol: "Social" },
    { key: "P005", name: "Ngozi Eze",      dob: "2001-09-17", phone: "09087654321", email: "ngozi@email.com",  address: "Gwarinpa, Abuja",  blood: "O-",  allergies: "Aspirin",   balance: 0,     status: "active",   gender: "Female", job: "Student",       medical: "None",         smoker: "No",  alcohol: "None" },
  ];

  const patientIds = {};
  for (const p of patientsSeed) {
    const ref = await db.collection("patients").add({
      name: p.name, dob: p.dob, phone: p.phone, email: p.email, address: p.address,
      blood: p.blood, allergies: p.allergies, balance: p.balance, status: p.status,
      gender: p.gender, job: p.job, medical: p.medical, smoker: p.smoker, alcohol: p.alcohol,
      createdAt: FieldValue.serverTimestamp(),
    });
    patientIds[p.key] = ref.id;
    console.log(`  ${p.name} → ${ref.id}`);
  }

  console.log("\nSeeding clinical records…");
  const clinicalSeed = [
    {
      key: "P001",
      odontogram: { "16": ["filling"], "26": ["crown"], "36": ["filling"], "46": ["caries"] },
      complaint: "Sensitivity on upper left teeth, occasional bleeding gums",
      bp: "130/85", pulse: "78", temp: "36.8", resp: "16",
      extraOral: "No swelling. Lymph nodes non-palpable. TMJ mild clicking left side.",
      intraOral: "Moderate plaque. BOP posterior regions. Gingival recession 31-33.",
      occlusion: "Class I malocclusion. Mild crowding anterior mandible.",
      notes: [
        { date: "2026-03-01", procedure: "Scaling & Root Planing", teeth: "Full mouth", description: "Full mouth debridement performed. Oral hygiene instructions given.", medications: "Chlorhexidine 0.12% BD x 2 weeks", followUp: "Review in 6 weeks" },
        { date: "2026-01-10", procedure: "Composite Filling", teeth: "36", description: "Caries excavation on 36. Composite resin restoration placed.", medications: "Ibuprofen 400mg PRN x 3 days", followUp: "Review at next routine visit" },
      ],
    },
    {
      key: "P002",
      odontogram: { "17": ["extraction"], "27": ["caries"], "37": ["rootCanal"], "47": ["crown"] },
      complaint: "Severe pain lower right wisdom area, worse at night.",
      bp: "128/80", pulse: "82", temp: "37.0", resp: "18",
      extraOral: "Mild facial asymmetry right side. Submandibular lymph node palpable.",
      intraOral: "Pericoronitis around 48. Plaque and calculus deposits. Halitosis.",
      occlusion: "Class I. Missing 17. Good posterior support.",
      notes: [
        { date: "2026-02-20", procedure: "Root Canal Treatment", teeth: "37", description: "Access cavity prepared. WL confirmed 21mm. Canals shaped to F3. Calcium hydroxide dressing placed.", medications: "Amoxicillin 500mg TDS x 5 days. Metronidazole 400mg TDS x 5 days.", followUp: "2 weeks for obturation" },
      ],
    },
    {
      key: "P003",
      odontogram: { "15": ["filling"], "25": ["filling"], "35": ["caries"], "45": ["caries"] },
      complaint: "Food packing between teeth. Mild cold sensitivity.",
      bp: "110/70", pulse: "76", temp: "36.6", resp: "16",
      extraOral: "NAD",
      intraOral: "Interproximal caries 35 and 45. Marginal leakage on 15.",
      occlusion: "Class I. Mild spacing upper anteriors.",
      notes: [
        { date: "2026-03-10", procedure: "Composite Filling x2", teeth: "35, 45", description: "Class II composite restorations 35 and 45. Rubber dam used. Contacts verified with floss.", medications: "Ibuprofen 400mg PRN", followUp: "Review in 3 months" },
      ],
    },
    {
      key: "P004",
      odontogram: { "18": ["extraction"], "28": ["extraction"], "38": ["implant"], "11": ["crown"], "21": ["crown"] },
      complaint: "Loose crown upper front tooth. Difficulty chewing.",
      bp: "145/92", pulse: "88", temp: "37.1", resp: "17",
      extraOral: "NAD.",
      intraOral: "Crown 11 debonded. Core intact. Caries below gumline 46.",
      occlusion: "Class III tendency. Wear facets anteriors.",
      notes: [
        { date: "2026-01-15", procedure: "Crown Re-cementation", teeth: "11", description: "Crown cleaned and re-cemented with GIC. Occlusion verified. Dietary precautions advised.", medications: "None", followUp: "Review 3 months or sooner if dislodged" },
      ],
    },
    {
      key: "P005",
      odontogram: { "17": ["impacted"], "27": ["impacted"], "12": ["caries"], "22": ["caries"] },
      complaint: "Wants braces. Crowded front teeth.",
      bp: "108/68", pulse: "72", temp: "36.5", resp: "15",
      extraOral: "Convex profile. Lip incompetence at rest.",
      intraOral: "Moderate crowding maxillary arch. 12 and 22 palatally displaced.",
      occlusion: "Class II div 1. Overjet 8mm. Overbite 40%.",
      notes: [
        { date: "2026-03-15", procedure: "Orthodontic Consultation", teeth: "Full arch", description: "Diagnostic records taken. OPG and cephalogram requested. Study models taken.", medications: "None", followUp: "Review with radiographs in 2 weeks" },
      ],
    },
  ];

  for (const c of clinicalSeed) {
    const patientId = patientIds[c.key];
    await db.collection("clinicalRecords").doc(patientId).set({
      odontogram: c.odontogram, complaint: c.complaint,
      bp: c.bp, pulse: c.pulse, temp: c.temp, resp: c.resp,
      extraOral: c.extraOral, intraOral: c.intraOral, occlusion: c.occlusion,
      updatedAt: FieldValue.serverTimestamp(),
    });
    for (const n of c.notes) {
      await db.collection("treatmentNotes").add({
        patientId, createdById: doctorId,
        date: n.date, procedure: n.procedure, teeth: n.teeth,
        description: n.description, medications: n.medications, followUp: n.followUp,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    console.log(`  Clinical for ${c.key} done`);
  }

  console.log("\nSeeding appointments…");
  const apptsSeed = [
    { pid: "P001", date: "2026-03-25", time: "09:00", type: "Cleaning",       status: "confirmed", notes: "Regular checkup" },
    { pid: "P002", date: "2026-03-20", time: "10:30", type: "Root Canal",     status: "confirmed", notes: "Follow-up" },
    { pid: "P003", date: "2026-04-01", time: "14:00", type: "Filling",        status: "pending",   notes: "" },
    { pid: "P004", date: "2026-03-22", time: "11:00", type: "Extraction",     status: "confirmed", notes: "Wisdom tooth" },
    { pid: "P005", date: "2026-03-28", time: "15:30", type: "Braces Consult", status: "pending",   notes: "" },
    { pid: "P001", date: "2026-03-18", time: "09:00", type: "Emergency",      status: "completed", notes: "Toothache" },
  ];
  for (const a of apptsSeed) {
    await db.collection("appointments").add({
      patientId: patientIds[a.pid], dentistId: doctorId,
      date: a.date, time: a.time, type: a.type, status: a.status, notes: a.notes,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  console.log(`  ${apptsSeed.length} appointments seeded`);

  console.log("\nSeeding invoices…");
  const invoicesSeed = [
    { pid: "P001", date: "2026-03-01", items: [{ d: "Dental Cleaning", a: 8000 }, { d: "X-Ray", a: 5000 }],        total: 13000, paid: 0,     status: "unpaid" },
    { pid: "P002", date: "2026-02-20", items: [{ d: "Root Canal", a: 45000 }],                                      total: 45000, paid: 45000, status: "paid" },
    { pid: "P003", date: "2026-03-10", items: [{ d: "Filling x2", a: 16000 }, { d: "Consultation", a: 3500 }],     total: 19500, paid: 11000, status: "partial" },
    { pid: "P005", date: "2026-03-15", items: [{ d: "Consultation", a: 3500 }],                                     total: 3500,  paid: 3500,  status: "paid" },
  ];
  for (const inv of invoicesSeed) {
    await db.collection("invoices").add({
      patientId: patientIds[inv.pid], date: inv.date,
      total: inv.total, paid: inv.paid, status: inv.status,
      items: inv.items,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  console.log(`  ${invoicesSeed.length} invoices seeded`);

  console.log("\nSeeding tasks…");
  const tasksSeed = [
    { title: "Restock anaesthetic supplies",               priority: "high",   due: "2026-03-20", done: false, who: "Nurse Bola" },
    { title: "Send appointment reminders for next week",   priority: "medium", due: "2026-03-21", done: false, who: "Kemi Adebayo" },
    { title: "Sterilize instruments (Room 2)",             priority: "high",   due: "2026-03-18", done: true,  who: "Nurse Bola" },
    { title: "Update patient intake forms",                priority: "low",    due: "2026-03-25", done: false, who: "Kemi Adebayo" },
    { title: "Submit insurance claims — Feb batch",        priority: "high",   due: "2026-03-19", done: false, who: "Kemi Adebayo" },
  ];
  for (const t of tasksSeed) {
    await db.collection("tasks").add({
      title: t.title, priority: t.priority, due: t.due, done: t.done,
      assignedToId: staffIds[t.who] || doctorId,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  console.log(`  ${tasksSeed.length} tasks seeded`);

  console.log("\nSeeding messages…");
  const messagesSeed = [
    { pid: "P001", type: "Reminder",  content: "Hi Amaka, reminder for your cleaning appointment on March 25 at 9AM. Call if you need to reschedule. — Yinlade Clinic." },
    { pid: "P002", type: "FollowUp",  content: "Hi Emeka, hope you are recovering well after your procedure. Reach out with any concerns. — Yinlade Clinic." },
    { pid: "P004", type: "Payment",   content: "Dear Chidi, your outstanding balance of ₦25,000 is due. Please call 08031234567 to arrange payment." },
  ];
  for (const m of messagesSeed) {
    await db.collection("messages").add({
      patientId: patientIds[m.pid], senderId: doctorId,
      type: m.type, content: m.content,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  console.log(`  ${messagesSeed.length} messages seeded`);

  console.log("\n✅ Firebase seed complete!");
}

main().catch((e) => { console.error(e); process.exit(1); });

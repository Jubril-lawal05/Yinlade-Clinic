import { NextResponse } from "next/server";
import { z } from "zod";
import { db, FieldValue } from "@/lib/firebase-admin";
import { getAuthedStaff } from "@/lib/auth";

const CreatePatient = z.object({
  name: z.string().min(1),
  age: z.union([z.string(), z.number()]).optional().or(z.literal("").transform(() => undefined)).optional(),
  displayId: z.string().optional().or(z.literal("").transform(() => undefined)).optional(),
  dob: z.string().min(1).optional().or(z.literal("").transform(() => undefined)).optional(),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal("").transform(() => undefined)).optional(),
  address: z.string().optional().or(z.literal("").transform(() => undefined)).optional(),
  job: z.string().optional().or(z.literal("").transform(() => undefined)).optional(),
  blood: z.string().optional().or(z.literal("").transform(() => undefined)).optional(),
  allergies: z.string().optional().or(z.literal("").transform(() => "None")).optional(),
  medical: z.string().optional().or(z.literal("").transform(() => undefined)).optional(),
  smoker: z.string().optional().or(z.literal("").transform(() => undefined)).optional(),
  alcohol: z.string().optional().or(z.literal("").transform(() => undefined)).optional(),
  gender: z.string().optional().or(z.literal("").transform(() => undefined)).optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

const PATIENT_COUNTER_SEED = 4949;
const PATIENT_PAGE_SIZE = 50;
const PATIENT_PAGE_MAX = 200;

function patientFromDoc(d: FirebaseFirestore.QueryDocumentSnapshot) {
  const p = d.data();
  return {
    id: d.id,
    name: p.name,
    displayId: p.displayId || "",
    age: p.age || "",
    dob: p.dob || "",
    phone: p.phone,
    email: p.email,
    address: p.address,
    job: p.job,
    blood: p.blood,
    allergies: p.allergies,
    medical: p.medical,
    smoker: p.smoker,
    alcohol: p.alcohol,
    gender: p.gender,
    status: p.status,
    balance: typeof p.balance === "number" ? p.balance : 0,
    lastVisit: p.lastVisit || "",
  };
}

export async function GET(req: Request) {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(
    PATIENT_PAGE_MAX,
    Math.max(1, Number(url.searchParams.get("limit") ?? PATIENT_PAGE_SIZE) || PATIENT_PAGE_SIZE),
  );
  const cursor = url.searchParams.get("cursor");

  let query: FirebaseFirestore.Query = db
    .collection("patients")
    .orderBy("createdAt", "desc")
    .limit(limit);

  if (cursor) {
    const cursorDoc = await db.collection("patients").doc(cursor).get();
    if (cursorDoc.exists) query = query.startAfter(cursorDoc);
  }

  const snap = await query.get();
  const patients = snap.docs.map(patientFromDoc);
  const nextCursor = snap.docs.length === limit ? snap.docs[snap.docs.length - 1].id : null;

  return NextResponse.json({ patients, nextCursor });
}

async function nextPatientDisplayId(): Promise<string> {
  const counterRef = db.collection("counters").doc("patient");
  const next = await db.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists ? Number(snap.data()?.value || PATIENT_COUNTER_SEED) : PATIENT_COUNTER_SEED;
    const value = current + 1;
    tx.set(counterRef, { value, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return value;
  });
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${next}/${mm}/${yyyy}`;
}

export async function POST(req: Request) {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (staff.role !== "Dentist" && staff.role !== "Admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const body = CreatePatient.safeParse(json);
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const customId = body.data.displayId || (await nextPatientDisplayId());

  const docRef = await db.collection("patients").add({
    name: body.data.name,
    displayId: customId,
    age: body.data.age || null,
    dob: body.data.dob || null,
    phone: body.data.phone,
    email: body.data.email || null,
    address: body.data.address || null,
    job: body.data.job || null,
    blood: body.data.blood || null,
    allergies: body.data.allergies || "None",
    medical: body.data.medical || null,
    smoker: body.data.smoker || null,
    alcohol: body.data.alcohol || null,
    gender: body.data.gender || null,
    status: body.data.status || "active",
    balance: 0,
    lastVisit: null,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ patient: { id: docRef.id, displayId: customId } });
}

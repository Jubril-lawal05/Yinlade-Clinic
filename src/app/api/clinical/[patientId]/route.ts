import { NextResponse } from "next/server";
import { z } from "zod";
import { db, FieldValue } from "@/lib/firebase-admin";
import { getAuthedStaff } from "@/lib/auth";

const Odonto = z.record(z.string(), z.array(z.string()));

const NoteSchema = z.object({
  id: z.string().min(1),
  date: z.string().min(1),
  dentist: z.string().optional(),
  procedure: z.string().min(1),
  teeth: z.string().optional(),
  description: z.string().optional().nullable(),
  medications: z.string().optional().nullable(),
  followUp: z.string().optional().nullable(),
});

const ClinicalBody = z.object({
  odontogram: Odonto,
  complaint: z.string().optional().default(""),
  bp: z.string().optional().default(""),
  pulse: z.string().optional().default(""),
  temp: z.string().optional().default(""),
  resp: z.string().optional().default(""),
  extraOral: z.string().optional().default(""),
  intraOral: z.string().optional().default(""),
  occlusion: z.string().optional().default(""),
  notes: z.array(NoteSchema).optional().default([]),
});

const FIRESTORE_BATCH_LIMIT = 450; // Firestore limit is 500; leave headroom.

async function commitInChunks(ops: Array<(b: FirebaseFirestore.WriteBatch) => void>) {
  for (let i = 0; i < ops.length; i += FIRESTORE_BATCH_LIMIT) {
    const slice = ops.slice(i, i + FIRESTORE_BATCH_LIMIT);
    const batch = db.batch();
    slice.forEach((apply) => apply(batch));
    await batch.commit();
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ patientId: string }> }) {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { patientId } = await params;
  const [crDoc, noteSnap, staffSnap] = await Promise.all([
    db.collection("clinicalRecords").doc(patientId).get(),
    db.collection("treatmentNotes").where("patientId", "==", patientId).get(),
    db.collection("staff").get(),
  ]);

  const staffMap = new Map<string, string>();
  staffSnap.docs.forEach((d) => staffMap.set(d.id, d.data().name));

  const notes = noteSnap.docs
    .sort((a, b) => (b.data().date > a.data().date ? 1 : -1))
    .map((d) => {
      const n = d.data();
      return {
        id: d.id,
        date: n.date || "",
        dentist: staffMap.get(n.createdById) || "",
        procedure: n.procedure,
        teeth: n.teeth || "",
        description: n.description || "",
        medications: n.medications || "",
        followUp: n.followUp || "",
      };
    });

  if (!crDoc.exists) {
    return NextResponse.json({
      odontogram: {}, complaint: "", bp: "", pulse: "", temp: "",
      resp: "", extraOral: "", intraOral: "", occlusion: "", notes,
    });
  }

  const cr = crDoc.data()!;
  return NextResponse.json({
    odontogram: cr.odontogram || {},
    complaint: cr.complaint || "",
    bp: cr.bp || "",
    pulse: cr.pulse || "",
    temp: cr.temp || "",
    resp: cr.resp || "",
    extraOral: cr.extraOral || "",
    intraOral: cr.intraOral || "",
    occlusion: cr.occlusion || "",
    notes,
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ patientId: string }> }) {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (staff.role !== "Dentist") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { patientId } = await params;
  const json = await req.json().catch(() => null);
  const body = ClinicalBody.safeParse(json);
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const crRef = db.collection("clinicalRecords").doc(patientId);
  const patientRef = db.collection("patients").doc(patientId);

  const existing = await db
    .collection("treatmentNotes")
    .where("patientId", "==", patientId)
    .select() // ids only — avoids pulling note bodies we already have client-side
    .get();

  const existingIds = new Set(existing.docs.map((d) => d.id));
  const incomingIds = new Set(body.data.notes.map((n) => n.id));

  const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
  const toUpsert = body.data.notes;

  const ops: Array<(b: FirebaseFirestore.WriteBatch) => void> = [];

  ops.push((b) => {
    b.set(
      crRef,
      {
        patientId,
        odontogram: body.data.odontogram,
        complaint: body.data.complaint,
        bp: body.data.bp || null,
        pulse: body.data.pulse || null,
        temp: body.data.temp || null,
        resp: body.data.resp || null,
        extraOral: body.data.extraOral || null,
        intraOral: body.data.intraOral || null,
        occlusion: body.data.occlusion || null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });

  ops.push((b) => {
    b.update(patientRef, { lastVisit: new Date().toISOString().slice(0, 10) });
  });

  for (const id of toDelete) {
    ops.push((b) => b.delete(db.collection("treatmentNotes").doc(id)));
  }

  for (const n of toUpsert) {
    const ref = db.collection("treatmentNotes").doc(n.id);
    ops.push((b) =>
      b.set(
        ref,
        {
          patientId,
          createdById: staff.id,
          date: n.date,
          procedure: n.procedure,
          teeth: n.teeth || null,
          description: n.description || null,
          medications: n.medications || null,
          followUp: n.followUp || null,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      ),
    );
  }

  await commitInChunks(ops);
  return NextResponse.json({ ok: true });
}

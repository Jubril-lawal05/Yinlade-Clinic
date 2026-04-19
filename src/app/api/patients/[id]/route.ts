import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/firebase-admin";
import { getAuthedStaff } from "@/lib/auth";

const UpdatePatient = z.object({
  name: z.string().min(1).optional(),
  dob: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")).optional(),
  address: z.string().optional(),
  job: z.string().optional(),
  blood: z.string().optional(),
  allergies: z.string().optional(),
  medical: z.string().optional(),
  smoker: z.string().optional(),
  alcohol: z.string().optional(),
  gender: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (staff.role !== "Dentist" && staff.role !== "Admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const body = UpdatePatient.safeParse(json);
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { id } = await params;
  const update: Record<string, any> = {};
  if (body.data.name !== undefined) update.name = body.data.name;
  if (body.data.dob !== undefined) update.dob = body.data.dob || null;
  if (body.data.phone !== undefined) update.phone = body.data.phone;
  if (body.data.email !== undefined) update.email = body.data.email || null;
  if (body.data.address !== undefined) update.address = body.data.address || null;
  if (body.data.job !== undefined) update.job = body.data.job || null;
  if (body.data.blood !== undefined) update.blood = body.data.blood || null;
  if (body.data.allergies !== undefined) update.allergies = body.data.allergies;
  if (body.data.medical !== undefined) update.medical = body.data.medical || null;
  if (body.data.smoker !== undefined) update.smoker = body.data.smoker || null;
  if (body.data.alcohol !== undefined) update.alcohol = body.data.alcohol || null;
  if (body.data.gender !== undefined) update.gender = body.data.gender || null;
  if (body.data.status !== undefined) update.status = body.data.status;

  await db.collection("patients").doc(id).update(update);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (staff.role !== "Dentist" && staff.role !== "Admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const batch = db.batch();

  batch.delete(db.collection("patients").doc(id));
  batch.delete(db.collection("clinicalRecords").doc(id));

  const [noteSnap, apptSnap, invSnap, msgSnap] = await Promise.all([
    db.collection("treatmentNotes").where("patientId", "==", id).get(),
    db.collection("appointments").where("patientId", "==", id).get(),
    db.collection("invoices").where("patientId", "==", id).get(),
    db.collection("messages").where("patientId", "==", id).get(),
  ]);

  noteSnap.docs.forEach((d) => batch.delete(d.ref));
  apptSnap.docs.forEach((d) => batch.delete(d.ref));
  invSnap.docs.forEach((d) => batch.delete(d.ref));
  msgSnap.docs.forEach((d) => batch.delete(d.ref));

  await batch.commit();
  return NextResponse.json({ ok: true });
}

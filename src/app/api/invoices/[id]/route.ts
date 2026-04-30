import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/firebase-admin";
import { getAuthedStaff } from "@/lib/auth";

const ItemSchema = z.object({
  d: z.string().min(1),
  a: z.union([z.string(), z.number()]),
});

const InvoiceUpdate = z.object({
  patientId: z.string().min(1),
  items: z.array(ItemSchema).min(1),
  date: z.string().optional(),
});

async function recalcPatientBalance(patientId: string) {
  const invSnap = await db.collection("invoices").where("patientId", "==", patientId).get();
  const outstanding = invSnap.docs.reduce((sum, d) => {
    const i = d.data();
    return sum + ((i.total || 0) - (i.paid || 0));
  }, 0);
  await db.collection("patients").doc(patientId).update({ balance: outstanding });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (staff.role !== "Dentist" && staff.role !== "Admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const body = InvoiceUpdate.safeParse(json);
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { id } = await params;
  
  const total = body.data.items.reduce((sum, it) => sum + Number(it.a), 0);
  const date = body.data.date || new Date().toISOString().slice(0, 10);

  const docRef = db.collection("invoices").doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
  
  const currentData = doc.data()!;
  let status = currentData.status;
  if (currentData.paid >= total) status = "paid";
  else if (currentData.paid > 0) status = "partial";
  else status = "unpaid";

  await docRef.update({
    patientId: body.data.patientId,
    date,
    total,
    status,
    items: body.data.items.map((it) => ({ d: it.d, a: Number(it.a) })),
  });

  await recalcPatientBalance(body.data.patientId);
  if (currentData.patientId !== body.data.patientId) {
    await recalcPatientBalance(currentData.patientId);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (staff.role !== "Dentist")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  
  const docRef = db.collection("invoices").doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const patientId = doc.data()!.patientId;
  await docRef.delete();
  await recalcPatientBalance(patientId);

  return NextResponse.json({ ok: true });
}

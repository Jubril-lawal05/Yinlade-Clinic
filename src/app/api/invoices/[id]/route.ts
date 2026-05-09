import { NextResponse } from "next/server";
import { z } from "zod";
import { db, FieldValue } from "@/lib/firebase-admin";
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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (staff.role !== "Dentist" && staff.role !== "Admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const body = InvoiceUpdate.safeParse(json);
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const newTotal = body.data.items.reduce((sum, it) => sum + Number(it.a), 0);
  if (!Number.isFinite(newTotal) || newTotal < 0)
    return NextResponse.json({ error: "Invalid total" }, { status: 400 });
  const date = body.data.date || new Date().toISOString().slice(0, 10);

  const { id } = await params;
  const invRef = db.collection("invoices").doc(id);

  try {
    await db.runTransaction(async (tx) => {
      const invSnap = await tx.get(invRef);
      if (!invSnap.exists) throw new Error("Not found");

      const inv = invSnap.data()!;
      const oldTotal = Number(inv.total) || 0;
      const oldPaid = Number(inv.paid) || 0;
      const oldPatientId = String(inv.patientId);
      const newPatientId = body.data.patientId;

      const newPaid = Math.min(oldPaid, newTotal);
      const newStatus = newPaid >= newTotal ? "paid" : newPaid > 0 ? "partial" : "unpaid";

      const oldPatientRef = db.collection("patients").doc(oldPatientId);
      const newPatientRef = db.collection("patients").doc(newPatientId);

      // Pre-fetch any patient docs we'll write to (transaction rule: reads before writes).
      await tx.get(oldPatientRef);
      if (oldPatientId !== newPatientId) await tx.get(newPatientRef);

      tx.update(invRef, {
        patientId: newPatientId,
        date,
        total: newTotal,
        paid: newPaid,
        status: newStatus,
        items: body.data.items.map((it) => ({ d: it.d, a: Number(it.a) })),
      });

      if (oldPatientId === newPatientId) {
        // Outstanding delta for same patient: (newTotal - newPaid) - (oldTotal - oldPaid)
        const delta = (newTotal - newPaid) - (oldTotal - oldPaid);
        if (delta !== 0) tx.update(oldPatientRef, { balance: FieldValue.increment(delta) });
      } else {
        const oldOutstanding = oldTotal - oldPaid;
        const newOutstanding = newTotal - newPaid;
        if (oldOutstanding !== 0)
          tx.update(oldPatientRef, { balance: FieldValue.increment(-oldOutstanding) });
        if (newOutstanding !== 0)
          tx.update(newPatientRef, { balance: FieldValue.increment(newOutstanding) });
      }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    const status = msg === "Not found" ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (staff.role !== "Dentist")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const invRef = db.collection("invoices").doc(id);

  try {
    await db.runTransaction(async (tx) => {
      const invSnap = await tx.get(invRef);
      if (!invSnap.exists) throw new Error("Not found");
      const inv = invSnap.data()!;
      const outstanding = (Number(inv.total) || 0) - (Number(inv.paid) || 0);
      const patientRef = db.collection("patients").doc(String(inv.patientId));
      await tx.get(patientRef);

      tx.delete(invRef);
      if (outstanding !== 0)
        tx.update(patientRef, { balance: FieldValue.increment(-outstanding) });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Delete failed";
    const status = msg === "Not found" ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }

  return NextResponse.json({ ok: true });
}

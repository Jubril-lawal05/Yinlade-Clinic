import { NextResponse } from "next/server";
import { z } from "zod";
import { db, FieldValue } from "@/lib/firebase-admin";
import { getAuthedStaff } from "@/lib/auth";

const Body = z.object({
  amount: z.union([z.string(), z.number()]),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (staff.role !== "Dentist" && staff.role !== "Admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const body = Body.safeParse(json);
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const amountNum = Number(body.data.amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0)
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  const { id } = await params;
  const invRef = db.collection("invoices").doc(id);
  const paymentRef = db.collection("payments").doc();

  try {
    await db.runTransaction(async (tx) => {
      const invSnap = await tx.get(invRef);
      if (!invSnap.exists) throw new Error("Invoice not found");

      const inv = invSnap.data()!;
      const total = Number(inv.total) || 0;
      const paid = Number(inv.paid) || 0;

      // Cap payment at remaining balance — prevents two simultaneous payments overpaying.
      const applied = Math.min(amountNum, Math.max(0, total - paid));
      if (applied <= 0) throw new Error("Invoice already paid");

      const newPaid = paid + applied;
      const status = newPaid >= total ? "paid" : "partial";

      const patientRef = db.collection("patients").doc(String(inv.patientId));
      await tx.get(patientRef);

      tx.update(invRef, { paid: newPaid, status });
      tx.set(paymentRef, {
        invoiceId: id,
        patientId: inv.patientId,
        amount: applied,
        recordedById: staff.id,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.update(patientRef, { balance: FieldValue.increment(-applied) });
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Payment failed";
    const status =
      msg === "Invoice not found" ? 404 :
      msg === "Invoice already paid" ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }

  return NextResponse.json({ ok: true });
}

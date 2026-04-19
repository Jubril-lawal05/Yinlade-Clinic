import { NextResponse } from "next/server";
import { z } from "zod";
import { db, FieldValue } from "@/lib/firebase-admin";
import { getAuthedStaff } from "@/lib/auth";

const Body = z.object({
  amount: z.union([z.string(), z.number()]),
});

async function recalcPatientBalance(patientId: string) {
  const invSnap = await db.collection("invoices").where("patientId", "==", patientId).get();
  const outstanding = invSnap.docs.reduce((sum, d) => {
    const i = d.data();
    return sum + ((i.total || 0) - (i.paid || 0));
  }, 0);
  await db.collection("patients").doc(patientId).update({ balance: outstanding });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (staff.role !== "Dentist" && staff.role !== "Admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const body = Body.safeParse(json);
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const amountNum = Number(body.data.amount);
  if (!amountNum || amountNum <= 0)
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

  const { id } = await params;
  const invDoc = await db.collection("invoices").doc(id).get();
  if (!invDoc.exists) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const inv = invDoc.data()!;
  const newPaid = Math.min((inv.paid || 0) + amountNum, inv.total || 0);
  const status = newPaid >= (inv.total || 0) ? "paid" : newPaid > 0 ? "partial" : "unpaid";

  await Promise.all([
    db.collection("payments").add({
      invoiceId: id,
      amount: amountNum,
      recordedById: staff.id,
      createdAt: FieldValue.serverTimestamp(),
    }),
    db.collection("invoices").doc(id).update({ paid: newPaid, status }),
  ]);

  await recalcPatientBalance(inv.patientId);
  return NextResponse.json({ ok: true });
}

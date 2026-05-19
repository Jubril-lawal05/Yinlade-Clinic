import { NextResponse } from "next/server";
import { z } from "zod";
import { db, FieldValue } from "@/lib/firebase-admin";
import { getAuthedStaff } from "@/lib/auth";

const ItemSchema = z.object({
  d: z.string().min(1),
  a: z.union([z.string(), z.number()]),
});

const InvoiceCreate = z.object({
  patientId: z.string().min(1),
  items: z.array(ItemSchema).min(1),
  date: z.string().optional(),
});

export async function GET() {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [invSnap, patientSnap] = await Promise.all([
    db.collection("invoices").orderBy("date", "desc").limit(200).get(),
    db.collection("patients").limit(500).get(),
  ]);

  const patientMap = new Map<string, string>();
  patientSnap.docs.forEach((d) => patientMap.set(d.id, d.data().name));

  return NextResponse.json({
    invoices: invSnap.docs.map((d) => {
      const i = d.data();
      return {
        id: d.id, pid: i.patientId, pname: patientMap.get(i.patientId) || "",
        date: i.date, total: typeof i.total === "number" ? i.total : 0,
        paid: typeof i.paid === "number" ? i.paid : 0, status: i.status,
        items: i.items || [],
      };
    }),
  });
}

export async function POST(req: Request) {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (staff.role !== "Dentist" && staff.role !== "Admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const body = InvoiceCreate.safeParse(json);
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const total = body.data.items.reduce((sum, it) => sum + Number(it.a), 0);
  if (!Number.isFinite(total) || total < 0)
    return NextResponse.json({ error: "Invalid total" }, { status: 400 });

  const date = body.data.date || new Date().toISOString().slice(0, 10);

  // New invoice: total is added to the patient's outstanding balance atomically.
  // Paid starts at 0, so outstanding delta == total.
  const invoiceRef = db.collection("invoices").doc();
  const patientRef = db.collection("patients").doc(body.data.patientId);

  await db.runTransaction(async (tx) => {
    const patientSnap = await tx.get(patientRef);
    if (!patientSnap.exists) throw new Error("Patient not found");

    tx.set(invoiceRef, {
      patientId: body.data.patientId,
      date,
      total,
      paid: 0,
      status: "unpaid",
      items: body.data.items.map((it) => ({ d: it.d, a: Number(it.a) })),
      createdAt: FieldValue.serverTimestamp(),
    });

    tx.update(patientRef, { balance: FieldValue.increment(total) });
  });

  return NextResponse.json({ invoice: { id: invoiceRef.id } });
}

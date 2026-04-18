import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthedStaff } from "@/lib/auth";

const Body = z.object({
  amount: z.union([z.string(), z.number()]),
});

function decToNumber(d: any) {
  if (d == null) return 0;
  if (typeof d === "number") return d;
  if (typeof d === "string") return Number(d);
  if (typeof d === "object" && typeof d.toNumber === "function") return d.toNumber();
  return Number(d);
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
  const inv = await prisma.invoice.findUnique({ where: { id } });
  if (!inv) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const total = decToNumber(inv.total);
  const paid = decToNumber(inv.paid);
  const newPaid = Math.min(paid + amountNum, total);
  const status = newPaid >= total ? "paid" : newPaid > 0 ? "partial" : "unpaid";

  await prisma.$transaction([
    prisma.payment.create({
      data: { invoiceId: id, amount: amountNum, recordedById: staff.id },
    }),
    prisma.invoice.update({ where: { id }, data: { paid: newPaid, status } }),
  ]);

  const invoices = await prisma.invoice.findMany({
    where: { patientId: inv.patientId },
    select: { total: true, paid: true },
  });
  const balance = invoices.reduce((s, i) => s + decToNumber(i.total) - decToNumber(i.paid), 0);
  await prisma.patient.update({ where: { id: inv.patientId }, data: { balance } });

  return NextResponse.json({ ok: true });
}

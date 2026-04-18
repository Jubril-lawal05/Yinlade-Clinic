import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
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

function decToNumber(d: any) {
  if (d == null) return 0;
  if (typeof d === "number") return d;
  if (typeof d === "string") return Number(d);
  if (typeof d === "object" && typeof d.toNumber === "function") return d.toNumber();
  return Number(d);
}

async function recalcBalance(patientId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { patientId },
    select: { total: true, paid: true },
  });
  const balance = invoices.reduce((s, i) => s + decToNumber(i.total) - decToNumber(i.paid), 0);
  await prisma.patient.update({ where: { id: patientId }, data: { balance } });
}

export async function GET() {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const invoices = await prisma.invoice.findMany({
    orderBy: { date: "desc" },
    select: {
      id: true, patientId: true, date: true, total: true, paid: true, status: true,
      patient: { select: { name: true } },
    },
  });

  return NextResponse.json({
    invoices: invoices.map((i) => ({
      id: i.id, pid: i.patientId, pname: i.patient.name,
      date: i.date.toISOString().slice(0, 10),
      total: decToNumber(i.total), paid: decToNumber(i.paid), status: i.status,
    })),
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
  const date = body.data.date
    ? new Date(body.data.date + "T00:00:00.000Z")
    : new Date();

  const created = await prisma.invoice.create({
    data: {
      patientId: body.data.patientId,
      date,
      total,
      paid: 0,
      status: "unpaid",
      items: {
        create: body.data.items.map((it) => ({ description: it.d, amount: Number(it.a) })),
      },
    },
  });

  await recalcBalance(body.data.patientId);
  return NextResponse.json({ invoice: { id: created.id } });
}

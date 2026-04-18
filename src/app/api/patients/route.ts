import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthedStaff } from "@/lib/auth";

const CreatePatient = z.object({
  name: z.string().min(1),
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

function toDate(dob?: string) {
  if (!dob) return null;
  const dt = new Date(dob + "T00:00:00.000Z");
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export async function GET() {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const patients = await prisma.patient.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, dob: true, phone: true, email: true, address: true,
      job: true, blood: true, allergies: true, medical: true, smoker: true,
      alcohol: true, gender: true, status: true, balance: true,
      clinicalRecord: { select: { updatedAt: true } },
    },
  });

  return NextResponse.json({
    patients: patients.map((p) => ({
      id: p.id, name: p.name,
      dob: p.dob ? p.dob.toISOString().slice(0, 10) : "",
      phone: p.phone, email: p.email, address: p.address, job: p.job,
      blood: p.blood, allergies: p.allergies, medical: p.medical,
      smoker: p.smoker, alcohol: p.alcohol, gender: p.gender, status: p.status,
      balance: typeof p.balance === "number" ? p.balance : (p.balance as any).toNumber(),
      lastVisit: p.clinicalRecord?.updatedAt ? p.clinicalRecord.updatedAt.toISOString().slice(0, 10) : "",
    })),
  });
}

export async function POST(req: Request) {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (staff.role !== "Dentist" && staff.role !== "Admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const body = CreatePatient.safeParse(json);
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const created = await prisma.patient.create({
    data: {
      name: body.data.name, dob: toDate(body.data.dob),
      phone: body.data.phone, email: body.data.email || null,
      address: body.data.address || null, job: body.data.job || null,
      blood: body.data.blood || null, allergies: body.data.allergies || "None",
      medical: body.data.medical || null, smoker: body.data.smoker || null,
      alcohol: body.data.alcohol || null, gender: body.data.gender || null,
      status: body.data.status || "active", balance: 0,
    },
  });

  return NextResponse.json({ patient: created });
}

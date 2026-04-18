import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthedStaff } from "@/lib/auth";

const AppointmentCreate = z.object({
  patientId: z.string().min(1),
  type: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  dentistId: z.string().min(1).optional(),
  status: z.enum(["pending", "confirmed"]).optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appts = await prisma.appointment.findMany({
    orderBy: { date: "asc" },
    select: {
      id: true, patientId: true, date: true, time: true,
      type: true, status: true, notes: true,
      patient: { select: { name: true } },
      dentist: { select: { name: true } },
    },
  });

  return NextResponse.json({
    appts: appts.map((a) => ({
      id: a.id, pid: a.patientId, pname: a.patient.name,
      date: a.date.toISOString().slice(0, 10), time: a.time,
      type: a.type, dentist: a.dentist.name, status: a.status, notes: a.notes || "",
    })),
  });
}

export async function POST(req: Request) {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (staff.role !== "Dentist" && staff.role !== "Admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const body = AppointmentCreate.safeParse(json);
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const created = await prisma.appointment.create({
    data: {
      patientId: body.data.patientId,
      dentistId: body.data.dentistId || staff.id,
      date: new Date(body.data.date + "T00:00:00.000Z"),
      time: body.data.time,
      type: body.data.type,
      status: body.data.status || "pending",
      notes: body.data.notes || null,
    },
    select: {
      id: true, patientId: true, date: true, time: true, type: true, status: true, notes: true,
      patient: { select: { name: true } },
      dentist: { select: { name: true } },
    },
  });

  return NextResponse.json({
    appt: {
      id: created.id, pid: created.patientId, pname: created.patient.name,
      date: created.date.toISOString().slice(0, 10), time: created.time,
      type: created.type, dentist: created.dentist.name,
      status: created.status, notes: created.notes || "",
    },
  });
}

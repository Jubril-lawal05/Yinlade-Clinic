import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthedStaff } from "@/lib/auth";

const Odonto = z.record(z.string(), z.array(z.string()));

const NoteSchema = z.object({
  id: z.string().min(1),
  date: z.string().min(1),
  dentist: z.string().optional(),
  procedure: z.string().min(1),
  teeth: z.string().optional(),
  description: z.string().optional().nullable(),
  medications: z.string().optional().nullable(),
  followUp: z.string().optional().nullable(),
});

const ClinicalBody = z.object({
  odontogram: Odonto,
  complaint: z.string().optional().default(""),
  bp: z.string().optional().default(""),
  pulse: z.string().optional().default(""),
  temp: z.string().optional().default(""),
  resp: z.string().optional().default(""),
  extraOral: z.string().optional().default(""),
  intraOral: z.string().optional().default(""),
  occlusion: z.string().optional().default(""),
  notes: z.array(NoteSchema).optional().default([]),
});

export async function GET(_req: Request, { params }: { params: Promise<{ patientId: string }> }) {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { patientId } = await params;
  const cr = await prisma.clinicalRecord.findUnique({
    where: { patientId },
    include: {
      treatmentNotes: {
        orderBy: { date: "desc" },
        select: {
          id: true, date: true, procedure: true, teeth: true,
          description: true, medications: true, followUp: true,
          createdBy: { select: { name: true } },
        },
      },
    },
  });

  if (!cr) {
    return NextResponse.json({
      odontogram: {}, complaint: "", bp: "", pulse: "", temp: "",
      resp: "", extraOral: "", intraOral: "", occlusion: "", notes: [],
    });
  }

  return NextResponse.json({
    odontogram: cr.odontogram || {},
    complaint: cr.complaint || "",
    bp: cr.bp || "",
    pulse: cr.pulse || "",
    temp: cr.temp || "",
    resp: cr.resp || "",
    extraOral: cr.extraOral || "",
    intraOral: cr.intraOral || "",
    occlusion: cr.occlusion || "",
    notes: cr.treatmentNotes.map((n) => ({
      id: n.id,
      date: n.date.toISOString().slice(0, 10),
      dentist: n.createdBy.name,
      procedure: n.procedure,
      teeth: n.teeth || "",
      description: n.description || "",
      medications: n.medications || "",
      followUp: n.followUp || "",
    })),
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ patientId: string }> }) {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (staff.role !== "Dentist") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { patientId } = await params;
  const json = await req.json().catch(() => null);
  const body = ClinicalBody.safeParse(json);
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    const cr = await tx.clinicalRecord.upsert({
      where: { patientId },
      create: {
        patientId,
        odontogram: body.data.odontogram,
        complaint: body.data.complaint || "",
        bp: body.data.bp || null,
        pulse: body.data.pulse || null,
        temp: body.data.temp || null,
        resp: body.data.resp || null,
        extraOral: body.data.extraOral || null,
        intraOral: body.data.intraOral || null,
        occlusion: body.data.occlusion || null,
      },
      update: {
        odontogram: body.data.odontogram,
        complaint: body.data.complaint || "",
        bp: body.data.bp || null,
        pulse: body.data.pulse || null,
        temp: body.data.temp || null,
        resp: body.data.resp || null,
        extraOral: body.data.extraOral || null,
        intraOral: body.data.intraOral || null,
        occlusion: body.data.occlusion || null,
      },
    });

    await tx.treatmentNote.deleteMany({ where: { patientId } });

    if (body.data.notes.length > 0) {
      await tx.treatmentNote.createMany({
        data: body.data.notes.map((n) => ({
          patientId,
          clinicalRecordId: cr.id,
          createdById: staff.id,
          date: new Date(n.date + "T00:00:00.000Z"),
          procedure: n.procedure,
          teeth: n.teeth || null,
          description: n.description || null,
          medications: n.medications || null,
          followUp: n.followUp || null,
        })),
      });
    }
  });

  return NextResponse.json({ ok: true });
}

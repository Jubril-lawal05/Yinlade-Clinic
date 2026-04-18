import { NextResponse } from "next/server";
import { getAuthedStaff } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function toYMD(d: Date | null | undefined) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

function decToNumber(d: any) {
  if (d == null) return 0;
  if (typeof d === "number") return d;
  if (typeof d === "string") return Number(d);
  if (typeof d === "object" && typeof d.toNumber === "function") return d.toNumber();
  return Number(d);
}

export async function GET() {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const staffList = await prisma.staff.findMany({
    select: { id: true, name: true, role: true, email: true, avatar: true },
    orderBy: { createdAt: "asc" },
  });

  const patients = await prisma.patient.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, dob: true, phone: true, email: true, address: true,
      job: true, blood: true, allergies: true, medical: true, smoker: true,
      alcohol: true, gender: true, status: true, balance: true,
      clinicalRecord: { select: { updatedAt: true } },
    },
  });

  const clinicalRecords = await prisma.clinicalRecord.findMany({
    include: {
      patient: { select: { id: true } },
      treatmentNotes: {
        orderBy: { date: "desc" },
        select: {
          id: true, date: true, createdById: true,
          createdBy: { select: { name: true } },
          procedure: true, teeth: true, description: true, medications: true, followUp: true,
        },
      },
    },
  });

  const appts = await prisma.appointment.findMany({
    orderBy: { date: "asc" },
    select: {
      id: true, patientId: true, dentistId: true, date: true, time: true,
      type: true, status: true, notes: true,
      patient: { select: { name: true } },
      dentist: { select: { name: true } },
    },
  });

  const invoices = await prisma.invoice.findMany({
    orderBy: { date: "desc" },
    select: {
      id: true, patientId: true, date: true, status: true, total: true, paid: true,
      patient: { select: { name: true } },
    },
  });

  const tasks = await prisma.task.findMany({
    orderBy: { due: "asc" },
    select: {
      id: true, title: true, priority: true, due: true, done: true,
      assignedTo: { select: { name: true } },
    },
  });

  const messages = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, patientId: true, type: true, content: true, createdAt: true,
      patient: { select: { name: true } },
      sender: { select: { name: true } },
    },
  });

  return NextResponse.json({
    user: staff,
    staff: staffList,
    patients: patients.map((p) => ({
      id: p.id, name: p.name, dob: p.dob ? toYMD(p.dob) : "",
      phone: p.phone, email: p.email, address: p.address, job: p.job,
      blood: p.blood, allergies: p.allergies, medical: p.medical,
      smoker: p.smoker, alcohol: p.alcohol, gender: p.gender,
      status: p.status, balance: decToNumber(p.balance),
      lastVisit: toYMD(p.clinicalRecord?.updatedAt),
    })),
    clinical: Object.fromEntries(
      clinicalRecords.map((cr) => {
        const notes = cr.treatmentNotes.map((n) => ({
          id: n.id, date: toYMD(n.date), dentist: n.createdBy.name,
          procedure: n.procedure, teeth: n.teeth || "",
          description: n.description || "", medications: n.medications || "",
          followUp: n.followUp || "",
        }));
        return [cr.patientId, {
          odontogram: cr.odontogram || {}, complaint: cr.complaint || "",
          bp: cr.bp || "", pulse: cr.pulse || "", temp: cr.temp || "",
          resp: cr.resp || "", extraOral: cr.extraOral || "",
          intraOral: cr.intraOral || "", occlusion: cr.occlusion || "", notes,
        }];
      })
    ),
    appts: appts.map((a) => ({
      id: a.id, pid: a.patientId, pname: a.patient.name,
      date: toYMD(a.date), time: a.time, type: a.type,
      dentist: a.dentist.name, status: a.status, notes: a.notes || "",
    })),
    invoices: invoices.map((i) => ({
      id: i.id, pid: i.patientId, pname: i.patient.name,
      date: toYMD(i.date), total: decToNumber(i.total),
      paid: decToNumber(i.paid), status: i.status,
    })),
    tasks: tasks.map((t) => ({
      id: t.id, title: t.title, priority: t.priority,
      due: toYMD(t.due), done: t.done, who: t.assignedTo?.name || "",
    })),
    messages: messages.map((m) => ({
      id: m.id, patientId: m.patientId, patient: m.patient.name,
      type: m.type === "FollowUp" ? "Follow-up" : m.type,
      content: m.content, date: toYMD(m.createdAt), sender: m.sender?.name || "",
    })),
  });
}

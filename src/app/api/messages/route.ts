import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthedStaff } from "@/lib/auth";

const Body = z.object({
  patientId: z.string().min(1),
  type: z.enum(["Reminder", "Follow-up", "Payment", "General"]),
  content: z.string().min(1),
});

export async function GET() {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, patientId: true, type: true, content: true, createdAt: true,
      patient: { select: { name: true } },
      sender: { select: { name: true } },
    },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id, patientId: m.patientId, patient: m.patient.name,
      type: m.type === "FollowUp" ? "Follow-up" : m.type,
      content: m.content, date: m.createdAt.toISOString().slice(0, 10),
      sender: m.sender?.name || "",
    })),
  });
}

export async function POST(req: Request) {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (staff.role !== "Dentist" && staff.role !== "Admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const body = Body.safeParse(json);
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const created = await prisma.message.create({
    data: {
      patientId: body.data.patientId,
      senderId: staff.id,
      type: body.data.type === "Follow-up" ? "FollowUp" : (body.data.type as any),
      content: body.data.content,
    },
  });

  return NextResponse.json({ message: { id: created.id } });
}

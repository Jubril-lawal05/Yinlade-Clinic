import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAuthedStaff } from "@/lib/auth";

const CreateTask = z.object({
  title: z.string().min(1),
  priority: z.enum(["high", "medium", "low"]),
  due: z.string().min(1),
  assignedToId: z.string().optional(),
  done: z.boolean().optional(),
});

export async function GET() {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await prisma.task.findMany({
    orderBy: { due: "asc" },
    select: {
      id: true, title: true, priority: true, due: true, done: true,
      assignedTo: { select: { name: true } },
    },
  });

  return NextResponse.json({
    tasks: tasks.map((t) => ({
      id: t.id, title: t.title, priority: t.priority,
      due: t.due.toISOString().slice(0, 10), done: t.done, who: t.assignedTo?.name || "",
    })),
  });
}

export async function POST(req: Request) {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const body = CreateTask.safeParse(json);
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const created = await prisma.task.create({
    data: {
      title: body.data.title,
      priority: body.data.priority,
      due: new Date(body.data.due + "T00:00:00.000Z"),
      done: body.data.done ?? false,
      assignedToId: body.data.assignedToId || null,
    },
  });

  return NextResponse.json({ task: { id: created.id } });
}

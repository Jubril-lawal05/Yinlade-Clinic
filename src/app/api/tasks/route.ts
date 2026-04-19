import { NextResponse } from "next/server";
import { z } from "zod";
import { db, FieldValue } from "@/lib/firebase-admin";
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

  const [taskSnap, staffSnap] = await Promise.all([
    db.collection("tasks").orderBy("due", "asc").get(),
    db.collection("staff").get(),
  ]);

  const staffMap = new Map<string, string>();
  staffSnap.docs.forEach((d) => staffMap.set(d.id, d.data().name));

  return NextResponse.json({
    tasks: taskSnap.docs.map((d) => {
      const t = d.data();
      return {
        id: d.id, title: t.title, priority: t.priority,
        due: t.due, done: t.done || false, who: staffMap.get(t.assignedToId) || "",
      };
    }),
  });
}

export async function POST(req: Request) {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const body = CreateTask.safeParse(json);
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const docRef = await db.collection("tasks").add({
    title: body.data.title,
    priority: body.data.priority,
    due: body.data.due,
    done: body.data.done ?? false,
    assignedToId: body.data.assignedToId || null,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ task: { id: docRef.id } });
}

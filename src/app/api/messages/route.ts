import { NextResponse } from "next/server";
import { z } from "zod";
import { db, FieldValue, tsToYMD } from "@/lib/firebase-admin";
import { getAuthedStaff } from "@/lib/auth";

const Body = z.object({
  patientId: z.string().min(1),
  type: z.enum(["Reminder", "Follow-up", "Payment", "General"]),
  content: z.string().min(1),
});

export async function GET() {
  const staff = await getAuthedStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [msgSnap, patientSnap, staffSnap] = await Promise.all([
    db.collection("messages").orderBy("createdAt", "desc").get(),
    db.collection("patients").get(),
    db.collection("staff").get(),
  ]);

  const patientMap = new Map<string, string>();
  patientSnap.docs.forEach((d) => patientMap.set(d.id, d.data().name));
  const staffMap = new Map<string, string>();
  staffSnap.docs.forEach((d) => staffMap.set(d.id, d.data().name));

  return NextResponse.json({
    messages: msgSnap.docs.map((d) => {
      const m = d.data();
      return {
        id: d.id, patientId: m.patientId, patient: patientMap.get(m.patientId) || "",
        type: m.type === "FollowUp" ? "Follow-up" : m.type,
        content: m.content, date: tsToYMD(m.createdAt), sender: staffMap.get(m.senderId) || "",
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
  const body = Body.safeParse(json);
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const docRef = await db.collection("messages").add({
    patientId: body.data.patientId,
    senderId: staff.id,
    type: body.data.type === "Follow-up" ? "FollowUp" : body.data.type,
    content: body.data.content,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ message: { id: docRef.id } });
}

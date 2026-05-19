import { NextResponse } from "next/server";
import { z } from "zod";
import { db, FieldValue } from "@/lib/firebase-admin";
import { getAuthedStaff } from "@/lib/auth";
import { getStaffMap } from "@/lib/staff-cache";

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

  const [apptSnap, patientSnap, staffMap] = await Promise.all([
    db.collection("appointments").orderBy("date", "asc").limit(200).get(),
    db.collection("patients").limit(500).get(),
    getStaffMap(),
  ]);

  const patientMap = new Map<string, string>();
  patientSnap.docs.forEach((d) => patientMap.set(d.id, d.data().name));

  return NextResponse.json({
    appts: apptSnap.docs.map((d) => {
      const a = d.data();
      return {
        id: d.id, pid: a.patientId, pname: patientMap.get(a.patientId) || "",
        date: a.date, time: a.time, type: a.type,
        dentist: staffMap.get(a.dentistId) || "", status: a.status, notes: a.notes || "",
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
  const body = AppointmentCreate.safeParse(json);
  if (!body.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const dentistId = body.data.dentistId || staff.id;

  // Reject double-booking: same dentist + date + time slot.
  const conflict = await db
    .collection("appointments")
    .where("dentistId", "==", dentistId)
    .where("date", "==", body.data.date)
    .where("time", "==", body.data.time)
    .where("status", "in", ["pending", "confirmed"])
    .limit(1)
    .get();

  if (!conflict.empty)
    return NextResponse.json({ error: "Slot already booked for this dentist" }, { status: 409 });

  const docRef = await db.collection("appointments").add({
    patientId: body.data.patientId,
    dentistId,
    date: body.data.date,
    time: body.data.time,
    type: body.data.type,
    status: body.data.status || "pending",
    notes: body.data.notes || null,
    createdAt: FieldValue.serverTimestamp(),
  });

  const [patientDoc, dentistDoc] = await Promise.all([
    db.collection("patients").doc(body.data.patientId).get(),
    db.collection("staff").doc(dentistId).get(),
  ]);

  return NextResponse.json({
    appt: {
      id: docRef.id, pid: body.data.patientId,
      pname: patientDoc.data()?.name || "",
      date: body.data.date, time: body.data.time, type: body.data.type,
      dentist: dentistDoc.data()?.name || "",
      status: body.data.status || "pending", notes: body.data.notes || "",
    },
  });
}

import { NextResponse } from "next/server";
import { getAuthedStaff } from "@/lib/auth";
import { db, tsToYMD } from "@/lib/firebase-admin";
import { getStaffList, getStaffMap } from "@/lib/staff-cache";

function decToNumber(d: any) {
  if (d == null) return 0;
  if (typeof d === "number") return d;
  if (typeof d === "string") return Number(d);
  if (typeof d === "object" && typeof d.toNumber === "function") return d.toNumber();
  return Number(d);
}

export async function GET() {
  try {
    const staff = await getAuthedStaff();
    if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [staffList, staffMap, patientSnap, apptSnap, invSnap, taskSnap, msgSnap] = await Promise.all([
      getStaffList(),
      getStaffMap(),
      db.collection("patients").orderBy("createdAt", "desc").limit(200).get(),
      db.collection("appointments").orderBy("date", "asc").limit(200).get(),
      db.collection("invoices").orderBy("date", "desc").limit(200).get(),
      db.collection("tasks").orderBy("due", "asc").limit(200).get(),
      db.collection("messages").orderBy("createdAt", "desc").limit(200).get(),
    ]);

    const patientMap = new Map<string, string>();
    patientSnap.docs.forEach((d) => patientMap.set(d.id, d.data().name));

    return NextResponse.json({
      user: staff,
      staff: staffList,
      patients: patientSnap.docs.map((d) => {
        const p = d.data();
        return {
          id: d.id, name: p.name, displayId: p.displayId || "", age: p.age || "", dob: p.dob || "",
          phone: p.phone, email: p.email, address: p.address, job: p.job,
          blood: p.blood, allergies: p.allergies, medical: p.medical,
          smoker: p.smoker, alcohol: p.alcohol, gender: p.gender,
          status: p.status, balance: decToNumber(p.balance),
          lastVisit: p.lastVisit || "",
        };
      }),
      // Clinical records are loaded on demand via GET /api/clinical/[patientId].
      // Preloading them caused an N+1 (one query per clinical record for treatment notes).
      clinical: {},
      appts: apptSnap.docs.map((d) => {
        const a = d.data();
        return {
          id: d.id, pid: a.patientId, pname: patientMap.get(a.patientId) || "",
          date: a.date, time: a.time, type: a.type,
          dentist: staffMap.get(a.dentistId) || "", status: a.status, notes: a.notes || "",
        };
      }),
      invoices: invSnap.docs.map((d) => {
        const i = d.data();
        return {
          id: d.id, pid: i.patientId, pname: patientMap.get(i.patientId) || "",
          date: i.date, total: decToNumber(i.total), paid: decToNumber(i.paid), status: i.status, items: i.items || [],
        };
      }),
      tasks: taskSnap.docs.map((d) => {
        const t = d.data();
        return {
          id: d.id, title: t.title, priority: t.priority,
          due: t.due, done: t.done || false, who: staffMap.get(t.assignedToId) || "",
        };
      }),
      messages: msgSnap.docs.map((d) => {
        const m = d.data();
        return {
          id: d.id, patientId: m.patientId, patient: patientMap.get(m.patientId) || "",
          type: m.type === "FollowUp" ? "Follow-up" : m.type,
          content: m.content, date: tsToYMD(m.createdAt), sender: staffMap.get(m.senderId) || "",
        };
      }),
    });
  } catch (e) {
    console.error("[bootstrap] error:", e);
    return NextResponse.json({ error: String(e instanceof Error ? e.message : e) }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getAuthedStaff } from "@/lib/auth";
import { db, tsToYMD } from "@/lib/firebase-admin";

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

  const [staffSnap, patientSnap, crSnap, apptSnap, invSnap, taskSnap, msgSnap] = await Promise.all([
    db.collection("staff").orderBy("createdAt", "asc").get(),
    db.collection("patients").orderBy("createdAt", "desc").get(),
    db.collection("clinicalRecords").get(),
    db.collection("appointments").orderBy("date", "asc").get(),
    db.collection("invoices").orderBy("date", "desc").get(),
    db.collection("tasks").orderBy("due", "asc").get(),
    db.collection("messages").orderBy("createdAt", "desc").get(),
  ]);

  const staffMap = new Map<string, string>();
  staffSnap.docs.forEach((d) => staffMap.set(d.id, d.data().name));

  const patientMap = new Map<string, string>();
  patientSnap.docs.forEach((d) => patientMap.set(d.id, d.data().name));

  // Build clinical records with treatment notes
  const noteSnaps = await Promise.all(
    crSnap.docs.map((cr) =>
      db.collection("treatmentNotes").where("patientId", "==", cr.data().patientId).orderBy("date", "desc").get()
    )
  );

  const clinical: Record<string, any> = {};
  crSnap.docs.forEach((cr, i) => {
    const c = cr.data();
    const notes = noteSnaps[i].docs.map((n) => {
      const nd = n.data();
      return {
        id: n.id, date: nd.date || "",
        dentist: staffMap.get(nd.createdById) || "",
        procedure: nd.procedure, teeth: nd.teeth || "",
        description: nd.description || "", medications: nd.medications || "",
        followUp: nd.followUp || "",
      };
    });
    clinical[c.patientId] = {
      odontogram: c.odontogram || {}, complaint: c.complaint || "",
      bp: c.bp || "", pulse: c.pulse || "", temp: c.temp || "",
      resp: c.resp || "", extraOral: c.extraOral || "",
      intraOral: c.intraOral || "", occlusion: c.occlusion || "", notes,
    };
  });

  return NextResponse.json({
    user: staff,
    staff: staffSnap.docs.map((d) => {
      const s = d.data();
      return { id: d.id, name: s.name, role: s.role, email: s.email, avatar: s.avatar };
    }),
    patients: patientSnap.docs.map((d) => {
      const p = d.data();
      return {
        id: d.id, name: p.name, dob: p.dob || "",
        phone: p.phone, email: p.email, address: p.address, job: p.job,
        blood: p.blood, allergies: p.allergies, medical: p.medical,
        smoker: p.smoker, alcohol: p.alcohol, gender: p.gender,
        status: p.status, balance: decToNumber(p.balance),
        lastVisit: p.lastVisit || "",
      };
    }),
    clinical,
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
        date: i.date, total: decToNumber(i.total), paid: decToNumber(i.paid), status: i.status,
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
}

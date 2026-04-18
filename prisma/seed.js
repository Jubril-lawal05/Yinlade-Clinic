require("dotenv/config");

const { PrismaClient, Prisma } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Reset tables first (idempotent for dev/CI)
  await prisma.message.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.treatmentNote.deleteMany();
  await prisma.clinicalRecord.deleteMany();
  await prisma.task.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.staff.deleteMany();

  // Staff (login)
  const staffSeed = [
    {
      legacyId: "U1",
      name: "Dr Adeyinka Lawal",
      role: "Dentist",
      email: "doctor@yinlade.ng",
      password: "doctor123",
      avatar: "AL",
    },
    {
      legacyId: "U2",
      name: "Kemi Adebayo",
      role: "Admin",
      email: "admin@yinlade.ng",
      password: "admin123",
      avatar: "KA",
    },
    {
      legacyId: "U3",
      name: "Nurse Bola",
      role: "Nurse",
      email: "nurse@yinlade.ng",
      password: "nurse123",
      avatar: "NB",
    },
  ];

  const staffByLegacy = new Map();

  for (const s of staffSeed) {
    const passwordHash = await bcrypt.hash(s.password, 10);
    const created = await prisma.staff.create({
      data: {
        name: s.name,
        role: s.role,
        email: s.email,
        passwordHash,
        avatar: s.avatar,
      },
    });
    staffByLegacy.set(s.legacyId, { id: created.id, role: created.role, name: created.name });
  }

  const dentist = staffByLegacy.get("U1").id;

  // Patients
  const patientsSeed = [
    {
      legacyId: "P001",
      name: "Amaka Okonkwo",
      dob: "1988-03-14",
      phone: "08031234567",
      email: "amaka@email.com",
      address: "Wuse 2, Abuja",
      blood: "O+",
      allergies: "Penicillin",
      lastVisit: "2026-03-01",
      balance: "15000",
      status: "active",
      gender: "Female",
      job: "Teacher",
      medical: "Hypertension",
      smoker: "No",
      alcohol: "None",
    },
    {
      legacyId: "P002",
      name: "Emeka Chukwu",
      dob: "1975-07-22",
      phone: "08056789012",
      email: "emeka@email.com",
      address: "Garki, Abuja",
      blood: "A+",
      allergies: "None",
      lastVisit: "2026-02-20",
      balance: "0",
      status: "active",
      gender: "Male",
      job: "Civil Servant",
      medical: "None",
      smoker: "Yes",
      alcohol: "Occasional",
    },
    {
      legacyId: "P003",
      name: "Fatima Al-Hassan",
      dob: "1995-11-08",
      phone: "08098765432",
      email: "fatima@email.com",
      address: "Maitama, Abuja",
      blood: "B+",
      allergies: "Latex",
      lastVisit: "2026-03-10",
      balance: "8500",
      status: "active",
      gender: "Female",
      job: "Lawyer",
      medical: "Asthma",
      smoker: "No",
      alcohol: "None",
    },
    {
      legacyId: "P004",
      name: "Chidi Nwosu",
      dob: "1982-05-30",
      phone: "07012345678",
      email: "chidi@email.com",
      address: "Asokoro, Abuja",
      blood: "AB+",
      allergies: "None",
      lastVisit: "2026-01-15",
      balance: "25000",
      status: "inactive",
      gender: "Male",
      job: "Engineer",
      medical: "Diabetes T2",
      smoker: "No",
      alcohol: "Social",
    },
    {
      legacyId: "P005",
      name: "Ngozi Eze",
      dob: "2001-09-17",
      phone: "09087654321",
      email: "ngozi@email.com",
      address: "Gwarinpa, Abuja",
      blood: "O-",
      allergies: "Aspirin",
      lastVisit: "2026-03-15",
      balance: "0",
      status: "active",
      gender: "Female",
      job: "Student",
      medical: "None",
      smoker: "No",
      alcohol: "None",
    },
  ];

  const patientByLegacy = new Map();

  for (const p of patientsSeed) {
    const created = await prisma.patient.create({
      data: {
        name: p.name,
        dob: p.dob ? new Date(p.dob + "T00:00:00.000Z") : null,
        phone: p.phone,
        email: p.email,
        address: p.address,
        job: p.job,
        blood: p.blood,
        allergies: p.allergies,
        medical: p.medical,
        smoker: p.smoker,
        alcohol: p.alcohol,
        gender: p.gender,
        status: p.status,
        balance: new Prisma.Decimal(p.balance),
      },
    });
    patientByLegacy.set(p.legacyId, { id: created.id, name: created.name });
  }

  // Clinical records + notes
  const clinicalSeed = [
    {
      legacyId: "P001",
      odontogram: { "16": ["filling"], "26": ["crown"], "36": ["filling"], "46": ["caries"] },
      complaint: "Sensitivity on upper left teeth, occasional bleeding gums",
      vitals: { bp: "130/85", pulse: "78", temp: "36.8", resp: "16" },
      extraOral: "No swelling. Lymph nodes non-palpable. TMJ mild clicking left side.",
      intraOral: "Moderate plaque. BOP posterior regions. Gingival recession 31-33.",
      occlusion: "Class I malocclusion. Mild crowding anterior mandible.",
      notes: [
        {
          date: "2026-03-01",
          procedure: "Scaling & Root Planing",
          teeth: "Full mouth",
          description:
            "Full mouth debridement performed. Oral hygiene instructions given. Patient counselled on correct brushing technique.",
          medications: "Chlorhexidine 0.12% BD x 2 weeks",
          followUp: "Review in 6 weeks",
        },
        {
          date: "2026-01-10",
          procedure: "Composite Filling",
          teeth: "36",
          description:
            "Caries excavation on 36. Composite resin restoration placed. Occlusion checked and adjusted.",
          medications: "Ibuprofen 400mg PRN x 3 days",
          followUp: "Review at next routine visit",
        },
      ],
    },
    {
      legacyId: "P002",
      odontogram: { "17": ["extraction"], "27": ["caries"], "37": ["rootCanal"], "47": ["crown"] },
      complaint: "Severe pain lower right wisdom area, worse at night.",
      vitals: { bp: "128/80", pulse: "82", temp: "37.0", resp: "18" },
      extraOral: "Mild facial asymmetry right side. Submandibular lymph node palpable.",
      intraOral: "Pericoronitis around 48. Plaque and calculus deposits. Halitosis.",
      occlusion: "Class I. Missing 17. Good posterior support.",
      notes: [
        {
          date: "2026-02-20",
          procedure: "Root Canal Treatment",
          teeth: "37",
          description:
            "Access cavity prepared. WL confirmed 21mm. Canals shaped to F3. Calcium hydroxide dressing placed.",
          medications:
            "Amoxicillin 500mg TDS x 5 days. Metronidazole 400mg TDS x 5 days. Ibuprofen 400mg PRN",
          followUp: "2 weeks for obturation",
        },
      ],
    },
    {
      legacyId: "P003",
      odontogram: { "15": ["filling"], "25": ["filling"], "35": ["caries"], "45": ["caries"] },
      complaint: "Food packing between teeth. Mild cold sensitivity.",
      vitals: { bp: "110/70", pulse: "76", temp: "36.6", resp: "16" },
      extraOral: "NAD",
      intraOral: "Interproximal caries 35 and 45. Marginal leakage on 15.",
      occlusion: "Class I. Mild spacing upper anteriors.",
      notes: [
        {
          date: "2026-03-10",
          procedure: "Composite Filling x2",
          teeth: "35, 45",
          description:
            "Class II composite restorations 35 and 45. Rubber dam used. Contacts verified with floss.",
          medications: "Ibuprofen 400mg PRN",
          followUp: "Review in 3 months",
        },
      ],
    },
    {
      legacyId: "P004",
      odontogram: {
        "18": ["extraction"],
        "28": ["extraction"],
        "38": ["implant"],
        "11": ["crown"],
        "21": ["crown"],
      },
      complaint: "Loose crown upper front tooth. Difficulty chewing.",
      vitals: { bp: "145/92", pulse: "88", temp: "37.1", resp: "17" },
      extraOral: "NAD.",
      intraOral: "Crown 11 debonded. Core intact. Caries below gumline 46.",
      occlusion: "Class III tendency. Wear facets anteriors.",
      notes: [
        {
          date: "2026-01-15",
          procedure: "Crown Re-cementation",
          teeth: "11",
          description:
            "Crown cleaned and re-cemented with GIC. Occlusion verified. Dietary precautions advised.",
          medications: "None",
          followUp: "Review 3 months or sooner if dislodged",
        },
      ],
    },
    {
      legacyId: "P005",
      odontogram: { "17": ["impacted"], "27": ["impacted"], "12": ["caries"], "22": ["caries"] },
      complaint: "Wants braces. Crowded front teeth.",
      vitals: { bp: "108/68", pulse: "72", temp: "36.5", resp: "15" },
      extraOral: "Convex profile. Lip incompetence at rest.",
      intraOral: "Moderate crowding maxillary arch. 12 and 22 palatally displaced.",
      occlusion: "Class II div 1. Overjet 8mm. Overbite 40%.",
      notes: [
        {
          date: "2026-03-15",
          procedure: "Orthodontic Consultation",
          teeth: "Full arch",
          description:
            "Diagnostic records taken. OPG and cephalogram requested. Study models taken. Fixed appliance therapy discussed. Estimated 18-24 months.",
          medications: "None",
          followUp: "Review with radiographs in 2 weeks",
        },
      ],
    },
  ];

  for (const c of clinicalSeed) {
    const patientId = patientByLegacy.get(c.legacyId).id;
    const clinical = await prisma.clinicalRecord.create({
      data: {
        patientId,
        odontogram: c.odontogram,
        complaint: c.complaint,
        bp: c.vitals.bp,
        pulse: c.vitals.pulse,
        temp: c.vitals.temp,
        resp: c.vitals.resp,
        extraOral: c.extraOral,
        intraOral: c.intraOral,
        occlusion: c.occlusion,
      },
    });

    for (const n of c.notes) {
      await prisma.treatmentNote.create({
        data: {
          patientId,
          createdById: dentist,
          clinicalRecordId: clinical.id,
          date: new Date(n.date + "T00:00:00.000Z"),
          procedure: n.procedure,
          teeth: n.teeth,
          description: n.description,
          medications: n.medications,
          followUp: n.followUp,
        },
      });
    }
  }

  // Appointments
  const apptsSeed = [
    {
      pid: "P001",
      date: "2026-03-25",
      time: "09:00",
      type: "Cleaning",
      status: "confirmed",
      notes: "Regular checkup",
    },
    {
      pid: "P002",
      date: "2026-03-20",
      time: "10:30",
      type: "Root Canal",
      status: "confirmed",
      notes: "Follow-up",
    },
    { pid: "P003", date: "2026-04-01", time: "14:00", type: "Filling", status: "pending", notes: "" },
    {
      pid: "P004",
      date: "2026-03-22",
      time: "11:00",
      type: "Extraction",
      status: "confirmed",
      notes: "Wisdom tooth",
    },
    {
      pid: "P005",
      date: "2026-03-28",
      time: "15:30",
      type: "Braces Consult",
      status: "pending",
      notes: "",
    },
    { pid: "P001", date: "2026-03-18", time: "09:00", type: "Emergency", status: "completed", notes: "Toothache" },
  ];

  for (const a of apptsSeed) {
    const patientId = patientByLegacy.get(a.pid).id;
    await prisma.appointment.create({
      data: {
        patientId,
        dentistId: dentist,
        date: new Date(a.date + "T00:00:00.000Z"),
        time: a.time,
        type: a.type,
        status: a.status,
        notes: a.notes,
      },
    });
  }

  // Invoices + items
  const invoicesSeed = [
    {
      pid: "P001",
      date: "2026-03-01",
      items: [
        { d: "Dental Cleaning", a: "8000" },
        { d: "X-Ray", a: "5000" },
      ],
      total: "13000",
      paid: "0",
      status: "unpaid",
    },
    { pid: "P002", date: "2026-02-20", items: [{ d: "Root Canal", a: "45000" }], total: "45000", paid: "45000", status: "paid" },
    {
      pid: "P003",
      date: "2026-03-10",
      items: [
        { d: "Filling x2", a: "16000" },
        { d: "Consultation", a: "3500" },
      ],
      total: "19500",
      paid: "11000",
      status: "partial",
    },
    { pid: "P005", date: "2026-03-15", items: [{ d: "Consultation", a: "3500" }], total: "3500", paid: "3500", status: "paid" },
  ];

  for (const inv of invoicesSeed) {
    const patientId = patientByLegacy.get(inv.pid).id;
    const total = new Prisma.Decimal(inv.total);
    const paid = new Prisma.Decimal(inv.paid);

    await prisma.invoice.create({
      data: {
        patientId,
        date: new Date(inv.date + "T00:00:00.000Z"),
        total,
        paid,
        status: inv.status,
        items: { create: inv.items.map((it) => ({ description: it.d, amount: new Prisma.Decimal(it.a) })) },
      },
    });
  }

  // Tasks
  const tasksSeed = [
    { title: "Restock anaesthetic supplies", priority: "high", due: "2026-03-20", done: false, who: "Nurse Bola" },
    { title: "Send appointment reminders for next week", priority: "medium", due: "2026-03-21", done: false, who: "Admin Kemi" },
    { title: "Sterilize instruments (Room 2)", priority: "high", due: "2026-03-18", done: true, who: "Nurse Bola" },
    { title: "Update patient intake forms", priority: "low", due: "2026-03-25", done: false, who: "Admin Kemi" },
    { title: "Submit insurance claims — Feb batch", priority: "high", due: "2026-03-19", done: false, who: "Admin Kemi" },
  ];

  const staffByName = new Map();
  for (const s of staffSeed) staffByName.set(s.name, staffByLegacy.get(s.legacyId).id);

  function whoToId(who) {
    if (who === "Admin Kemi") return staffByName.get("Kemi Adebayo");
    if (who === "Nurse Bola") return staffByName.get("Nurse Bola");
    return dentist;
  }

  for (const t of tasksSeed) {
    await prisma.task.create({
      data: {
        title: t.title,
        priority: t.priority,
        due: new Date(t.due + "T00:00:00.000Z"),
        done: t.done,
        assignedToId: whoToId(t.who),
      },
    });
  }

  // Communications messages (store-only for now)
  const messagesSeed = [
    {
      pid: "P001",
      type: "Reminder",
      content:
        "Hi Amaka, reminder for your cleaning appointment on March 25 at 9AM. Call if you need to reschedule. — Yinlade Clinic.",
      date: "2026-03-18",
    },
    {
      pid: "P002",
      type: "FollowUp",
      content:
        "Hi Emeka, hope you are recovering well after your procedure. Reach out with any concerns. — Yinlade Clinic.",
      date: "2026-03-17",
    },
    {
      pid: "P004",
      type: "Payment",
      content:
        "Dear Chidi, your outstanding balance of N25,000 is due. Please call 08031234567 to arrange payment.",
      date: "2026-03-16",
    },
  ];

  for (const m of messagesSeed) {
    const patientId = patientByLegacy.get(m.pid).id;
    await prisma.message.create({
      data: {
        patientId,
        senderId: dentist,
        type: m.type,
        content: m.content,
        createdAt: new Date(m.date + "T00:00:00.000Z"),
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


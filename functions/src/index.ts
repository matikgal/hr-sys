import * as admin from "firebase-admin";
import { onDocumentWritten, onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";

admin.initializeApp();
const db = admin.firestore();

const STATS_DOC = db.collection("system_stats").doc("metrics");

async function recomputeStats(): Promise<void> {
  const [empSnap, candidatesSnap, leavesTodaySnap] = await Promise.all([
    db.collection("employees").get(),
    db.collection("candidates").where("stage", "not-in", ["hired", "rejected"]).get(),
    db.collection("leaves")
      .where("status", "in", ["approved", "auto_approved"])
      .where("startDate", "<=", new Date().toISOString().split("T")[0])
      .where("endDate", ">=", new Date().toISOString().split("T")[0])
      .get(),
  ]);

  const totalEmployees = empSnap.size;
  const activeEmployees = empSnap.docs.filter(d => d.data().status === "active").length;
  const activeRecruitments = candidatesSnap.size;
  const absentToday = leavesTodaySnap.size;

  await STATS_DOC.set(
    { totalEmployees, activeEmployees, activeRecruitments, absentToday, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  );
}

// Trigger on employee writes
export const onEmployeeWrite = onDocumentWritten("employees/{id}", async () => {
  await recomputeStats();
});

// Trigger on candidate stage changes
export const onCandidateWrite = onDocumentWritten("candidates/{id}", async () => {
  await recomputeStats();
});

// Trigger on leave changes
export const onLeaveWrite = onDocumentWritten("leaves/{id}", async () => {
  await recomputeStats();
});

// Scheduled daily recalculation at midnight Warsaw time
export const dailyStatsRecalc = onSchedule(
  { schedule: "0 0 * * *", timeZone: "Europe/Warsaw" },
  async () => { await recomputeStats(); }
);

// ── Email notifications ────────────────────────────────────────────────────
// Uses Firebase Extension "Trigger Email" which watches the `mail` collection.
// Install: firebase ext:install firebase/firestore-send-email

async function queueEmail(to: string, subject: string, html: string): Promise<void> {
  await db.collection("mail").add({ to, message: { subject, html } });
}

// Notify manager when a new leave request is submitted
export const onLeaveCreated = onDocumentCreated("leaves/{id}", async (event) => {
  const leave = event.data?.data();
  if (!leave) return;

  // Find department manager
  const empSnap = await db.collection("employees").where("authId", "==", leave.employeeId).limit(1).get();
  if (empSnap.empty) return;
  const employee = empSnap.docs[0].data();

  const deptSnap = await db.collection("departments").doc(employee.departmentId).get();
  const dept = deptSnap.data();
  if (!dept?.managerId) return;

  const managerSnap = await db.collection("employees").where("authId", "==", dept.managerId).limit(1).get();
  if (managerSnap.empty) return;
  const manager = managerSnap.docs[0].data();
  if (!manager.email) return;

  await queueEmail(
    manager.email,
    `Nowy wniosek urlopowy — ${leave.employeeName}`,
    `<p>${leave.employeeName} złożył(a) wniosek urlopowy na dni <strong>${leave.startDate} – ${leave.endDate}</strong> (${leave.daysCount} dni).</p>
     <p>Zaloguj się do systemu HR, aby zatwierdzić lub odrzucić wniosek.</p>`
  );
});

// Notify employee when leave is approved or rejected
export const onLeaveStatusChanged = onDocumentWritten("leaves/{id}", async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!before || !after) return;
  if (before.status === after.status) return;
  if (!["approved", "auto_approved", "rejected"].includes(after.status)) return;

  const empSnap = await db.collection("employees").doc(after.employeeId).get();
  const emp = empSnap.data();
  if (!emp?.email) return;

  const isApproved = after.status !== "rejected";
  await queueEmail(
    emp.email,
    isApproved ? "Twój wniosek urlopowy został zatwierdzony" : "Twój wniosek urlopowy został odrzucony",
    isApproved
      ? `<p>Twój wniosek na urlop <strong>${after.startDate} – ${after.endDate}</strong> został zatwierdzony.</p>`
      : `<p>Twój wniosek na urlop <strong>${after.startDate} – ${after.endDate}</strong> został odrzucony. Skontaktuj się z przełożonym.</p>`
  );
});

// Alert HR 14 days before training expiry (daily check)
export const dailyTrainingExpiryAlert = onSchedule(
  { schedule: "0 8 * * *", timeZone: "Europe/Warsaw" },
  async () => {
    const alertDate = new Date();
    alertDate.setDate(alertDate.getDate() + 14);
    const alertDateStr = alertDate.toISOString().split("T")[0];

    const snap = await db.collection("employee_trainings")
      .where("expiryDate", "==", alertDateStr)
      .where("status", "==", "completed")
      .get();

    for (const doc of snap.docs) {
      const et = doc.data();
      const [empSnap, trainingSnap] = await Promise.all([
        db.collection("employees").doc(et.employeeId).get(),
        db.collection("trainings").doc(et.trainingId).get(),
      ]);
      const emp = empSnap.data();
      const training = trainingSnap.data();
      if (!emp?.email || !training) continue;

      await queueEmail(
        emp.email,
        `Szkolenie wygasa za 14 dni — ${training.title}`,
        `<p>Twoje szkolenie <strong>${training.title}</strong> wygasa <strong>${et.expiryDate}</strong>.</p>
         <p>Zaloguj się do systemu HR i odśwież certyfikat przed datą wygaśnięcia.</p>`
      );
    }
  }
);

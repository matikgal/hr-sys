import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  getDoc,
  doc,
  addDoc, 
  updateDoc,
  query, 
  where, 
  orderBy, 
  limit,
  runTransaction,
  QueryDocumentSnapshot,
  DocumentData,
  Timestamp
} from "firebase/firestore";
import { Leave, LeaveBalance, Employee } from "@/types";
import { logAudit } from "./audit";

const COLLECTION_NAME = "leaves";
const BALANCES_COLLECTION = "leave_balances";
const EMPLOYEES_COLLECTION = "employees";

export const getLeaveBalance = async (employeeId: string): Promise<LeaveBalance | null> => {
  const docRef = doc(db, BALANCES_COLLECTION, employeeId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as LeaveBalance;
  }
  
  // Return default balance if not found
  return {
    employeeId,
    vacationTotal: 26,
    vacationUsed: 0,
    sickUsed: 0
  };
};

export const getAllLeaves = async (): Promise<Leave[]> => {
  const leavesCol = collection(db, COLLECTION_NAME);
  const q = query(leavesCol, orderBy("startDate", "desc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
    id: doc.id,
    ...doc.data()
  } as Leave));
};

export const getEmployeeLeaves = async (employeeId: string): Promise<Leave[]> => {
  const leavesCol = collection(db, COLLECTION_NAME);
  const q = query(
    leavesCol, 
    where("employeeId", "==", employeeId), 
    orderBy("startDate", "desc")
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
    id: doc.id,
    ...doc.data()
  } as Leave));
};

export const requestLeave = async (leaveData: Omit<Leave, 'id' | 'status'>): Promise<string> => {
  const leavesCol = collection(db, COLLECTION_NAME);

  // 1. Overlap check — outside transaction (queries not supported inside Firestore transactions)
  const qOverlap = query(
    leavesCol,
    where("employeeId", "==", leaveData.employeeId),
    where("status", "in", ["pending", "approved", "auto_approved"])
  );
  const overlapSnap = await getDocs(qOverlap);
  const hasOverlap = overlapSnap.docs.some(d => {
    const existing = d.data() as Leave;
    return leaveData.startDate <= existing.endDate && leaveData.endDate >= existing.startDate;
  });
  if (hasOverlap) {
    throw new Error("Wybrany termin nakłada się na inny wniosek.");
  }

  // 2. Auto-approval pre-check — outside transaction
  // Sick leave is always auto-approved
  let autoApprove = leaveData.type === 'sick';

  if (!autoApprove && leaveData.type === 'vacation' && leaveData.daysCount < 3) {
    const empRef = doc(db, EMPLOYEES_COLLECTION, leaveData.employeeId);
    const empSnap = await getDoc(empRef);
    if (empSnap.exists()) {
      const employee = empSnap.data() as Employee;

      const qDept = query(
        collection(db, EMPLOYEES_COLLECTION),
        where("departmentId", "==", employee.departmentId)
      );
      const deptSnap = await getDocs(qDept);
      const totalInDept = deptSnap.size;

      if (totalInDept > 0) {
        const qLeavesDept = query(
          leavesCol,
          where("status", "in", ["approved", "auto_approved"])
        );
        const leavesDeptSnap = await getDocs(qLeavesDept);
        const deptEmployeeIds = new Set(deptSnap.docs.map(d => d.id));
        const onLeaveCount = leavesDeptSnap.docs.filter(d => {
          const l = d.data() as Leave;
          return deptEmployeeIds.has(l.employeeId) &&
            leaveData.startDate <= l.endDate && leaveData.endDate >= l.startDate;
        }).length;

        autoApprove = (onLeaveCount / totalInDept) * 100 < 20;
      }
    }
  }

  // 3. Transaction: balance check + write
  return await runTransaction(db, async (transaction) => {
    const balanceRef = doc(db, BALANCES_COLLECTION, leaveData.employeeId);
    const balanceSnap = await transaction.get(balanceRef);

    let balance: LeaveBalance;
    if (!balanceSnap.exists()) {
      // Use default balance in-memory — no write needed, balance doc will be created on first update
      balance = {
        employeeId: leaveData.employeeId,
        vacationTotal: 26,
        vacationUsed: 0,
        sickUsed: 0
      };
    } else {
      balance = balanceSnap.data() as LeaveBalance;
    }

    if (leaveData.type === 'vacation') {
      const available = balance.vacationTotal - balance.vacationUsed;
      if (available < leaveData.daysCount) {
        throw new Error("Niewystarczające saldo urlopowe.");
      }
    }

    const status: Leave['status'] = autoApprove ? 'auto_approved' : 'pending';

    if (autoApprove) {
      const balanceUpdate =
        leaveData.type === 'vacation'
          ? { vacationUsed: balance.vacationUsed + leaveData.daysCount }
          : leaveData.type === 'sick'
          ? { sickUsed: balance.sickUsed + leaveData.daysCount }
          : null;

      if (balanceUpdate) {
        if (balanceSnap.exists()) {
          transaction.update(balanceRef, balanceUpdate);
        } else {
          transaction.set(balanceRef, { ...balance, ...balanceUpdate });
        }
      }
    }

    const newLeaveRef = doc(leavesCol);
    transaction.set(newLeaveRef, {
      ...leaveData,
      status,
      createdAt: new Date().toISOString()
    });

    return newLeaveRef.id;
  });
};

export const approveLeave = async (leaveId: string, approverId: string): Promise<void> => {
  await runTransaction(db, async (transaction) => {
    const leaveRef = doc(db, COLLECTION_NAME, leaveId);
    const leaveSnap = await transaction.get(leaveRef);

    if (!leaveSnap.exists()) throw new Error("Wniosek nie istnieje.");
    const leave = leaveSnap.data() as Leave;
    if (leave.status !== 'pending') throw new Error("Wniosek został już przetworzony.");

    // All reads before any writes (Firestore transaction requirement)
    const balanceRef = doc(db, BALANCES_COLLECTION, leave.employeeId);
    const balanceSnap = await transaction.get(balanceRef);

    // Writes
    transaction.update(leaveRef, { status: 'approved', approverId });

    if (balanceSnap.exists()) {
      const balance = balanceSnap.data() as LeaveBalance;
      if (leave.type === 'vacation') {
        transaction.update(balanceRef, { vacationUsed: balance.vacationUsed + leave.daysCount });
      } else if (leave.type === 'sick') {
        transaction.update(balanceRef, { sickUsed: balance.sickUsed + leave.daysCount });
      }
    }
  });
  await logAudit({
    action: 'approve_leave',
    module: 'leaves',
    actorId: approverId,
    actorName: approverId,
    targetId: leaveId,
    after: { status: 'approved', approverId },
  });
};

export const rejectLeave = async (leaveId: string, approverId: string): Promise<void> => {
  const leaveRef = doc(db, COLLECTION_NAME, leaveId);
  await updateDoc(leaveRef, { status: 'rejected', approverId });
  await logAudit({
    action: 'reject_leave',
    module: 'leaves',
    actorId: approverId,
    actorName: approverId,
    targetId: leaveId,
    after: { status: 'rejected', approverId },
  });
};

export const getPendingLeaves = async (max = 5): Promise<Leave[]> => {
  const col = collection(db, COLLECTION_NAME);
  const q = query(col, where("status", "==", "pending"), limit(max * 4));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Leave))
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, max);
};

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
  return await runTransaction(db, async (transaction) => {
    // 1. Get Employee Info (for department)
    const empRef = doc(db, EMPLOYEES_COLLECTION, leaveData.employeeId);
    const empSnap = await transaction.get(empRef);
    if (!empSnap.exists()) throw new Error("Pracownik nie istnieje.");
    const employee = empSnap.data() as Employee;

    // 2. Overlap Check
    // Note: Transactional queries are not supported in Firestore SDK direct transaction block.
    // However, we can perform a read before or within if we use collection references.
    // To keep it simple and within the "surgical" update scope, we will use a separate check before the transaction or accept the limit.
    // For this module, we'll perform the check inside the transaction by reading the whole collection if necessary, 
    // but better to do it via a query just before.
    
    // Simple check for overlapping leaves for this employee
    const leavesCol = collection(db, COLLECTION_NAME);
    const qOverlap = query(
      leavesCol,
      where("employeeId", "==", leaveData.employeeId),
      where("status", "in", ["pending", "approved", "auto_approved"])
    );
    const overlapSnap = await getDocs(qOverlap);
    const hasOverlap = overlapSnap.docs.some(doc => {
      const existing = doc.data() as Leave;
      return (leaveData.startDate <= existing.endDate && leaveData.endDate >= existing.startDate);
    });

    if (hasOverlap) {
      throw new Error("Wybrany termin nakłada się na inny wniosek.");
    }

    // 3. Check Balance
    const balanceRef = doc(db, BALANCES_COLLECTION, leaveData.employeeId);
    const balanceSnap = await transaction.get(balanceRef);
    
    let balance: LeaveBalance;
    if (!balanceSnap.exists()) {
      balance = {
        employeeId: leaveData.employeeId,
        vacationTotal: 26,
        vacationUsed: 0,
        sickUsed: 0
      };
      transaction.set(balanceRef, balance);
    } else {
      balance = balanceSnap.data() as LeaveBalance;
    }

    if (leaveData.type === 'vacation') {
      const available = balance.vacationTotal - balance.vacationUsed;
      if (available < leaveData.daysCount) {
        throw new Error("Niewystarczające saldo urlopowe.");
      }
    }

    // 4. Auto-approval Logic (Roadmap: < 3 days AND < 20% of department on leave)
    let status: Leave['status'] = 'pending';
    
    if (leaveData.type === 'vacation' && leaveData.daysCount < 3) {
      // Check department rule
      const qDept = query(
        collection(db, EMPLOYEES_COLLECTION),
        where("departmentId", "==", employee.departmentId)
      );
      const deptSnap = await getDocs(qDept);
      const totalInDept = deptSnap.size;

      const qLeavesDept = query(
        collection(db, COLLECTION_NAME),
        where("status", "in", ["approved", "auto_approved"])
      );
      const leavesDeptSnap = await getDocs(qLeavesDept);
      
      const onLeaveCount = leavesDeptSnap.docs.filter(doc => {
        const l = doc.data() as Leave;
        // Check if any employee from the same department is on leave during this period
        const isSameDept = deptSnap.docs.some(d => d.id === l.employeeId);
        return isSameDept && (leaveData.startDate <= l.endDate && leaveData.endDate >= l.startDate);
      }).length;

      const leavePercentage = (onLeaveCount / totalInDept) * 100;
      
      if (leavePercentage < 20) {
        status = 'auto_approved';
        // Update balance if auto-approved
        transaction.update(balanceRef, {
          vacationUsed: balance.vacationUsed + leaveData.daysCount
        });
      }
    }

    // 5. Create Leave Record
    const newLeaveRef = doc(leavesCol);
    const newLeave = {
      ...leaveData,
      status,
      createdAt: new Date().toISOString()
    };
    
    transaction.set(newLeaveRef, newLeave);
    
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

    // Update Status
    transaction.update(leaveRef, { 
      status: 'approved',
      approverId
    });

    // Update Balance
    const balanceRef = doc(db, BALANCES_COLLECTION, leave.employeeId);
    const balanceSnap = await transaction.get(balanceRef);
    
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

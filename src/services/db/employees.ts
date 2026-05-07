import { db, storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { 
  collection, 
  getDocs, 
  getDoc,
  doc,
  addDoc, 
  updateDoc,
  query, 
  orderBy,
  where,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { Employee, JobHistory } from "@/types";

const COLLECTION_NAME = "employees";

export const getAllEmployees = async (options?: { 
  status?: Employee['status'], 
  departmentId?: string,
  limit?: number 
}): Promise<Employee[]> => {
  const employeesCol = collection(db, COLLECTION_NAME);
  let q = query(employeesCol, orderBy("lastName", "asc"));

  if (options?.status) {
    q = query(q, where("status", "==", options.status));
  }

  if (options?.departmentId) {
    q = query(q, where("departmentId", "==", options.departmentId));
  }

  if (options?.limit) {
    q = query(q, limit(options.limit));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
};

export const getEmployeeById = async (id: string): Promise<Employee | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Employee;
  }
  return null;
};

export const getEmployeeByAuthId = async (authId: string, email?: string | null): Promise<Employee | null> => {
  const employeesCol = collection(db, COLLECTION_NAME);
  
  // Try by authId
  const qAuth = query(employeesCol, where("authId", "==", authId), limit(1));
  const snapshotAuth = await getDocs(qAuth);
  
  if (!snapshotAuth.empty) {
    const d = snapshotAuth.docs[0];
    return { id: d.id, ...d.data() } as Employee;
  }
  
  // Try by email if provided
  if (email) {
    const qEmail = query(employeesCol, where("email", "==", email), limit(1));
    const snapshotEmail = await getDocs(qEmail);
    
    if (!snapshotEmail.empty) {
      const d = snapshotEmail.docs[0];
      // Update the authId so it matches next time
      await updateDoc(doc(db, COLLECTION_NAME, d.id), { authId });
      return { id: d.id, ...d.data(), authId } as Employee;
    }
  }
  
  return null;
};

export const addEmployee = async (employee: Omit<Employee, 'id'>): Promise<string> => {
  const employeesCol = collection(db, COLLECTION_NAME);
  const docRef = await addDoc(employeesCol, employee);
  return docRef.id;
};

export const getEmployeeJobHistory = async (employeeId: string): Promise<JobHistory[]> => {
  const historyCol = collection(db, COLLECTION_NAME, employeeId, "job_history");
  const q = query(historyCol, orderBy("startDate", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobHistory));
};

export const addJobHistory = async (employeeId: string, history: Omit<JobHistory, 'id'>): Promise<string> => {
  const historyCol = collection(db, COLLECTION_NAME, employeeId, "job_history");
  const docRef = await addDoc(historyCol, history);
  return docRef.id;
};

export const updateEmployee = async (id: string, data: Partial<Omit<Employee, 'id'>>): Promise<void> => {
  const ref = doc(db, COLLECTION_NAME, id);
  await updateDoc(ref, data as Record<string, unknown>);
};

export const uploadAvatar = async (
  employeeId: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> => {
  const storageRef = ref(storage, `avatars/${employeeId}/${Date.now()}_${file.name}`);
  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      'state_changed',
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      () => resolve()
    );
  });
  const url = await getDownloadURL(storageRef);
  await updateEmployee(employeeId, { avatarUrl: url });
  return url;
};

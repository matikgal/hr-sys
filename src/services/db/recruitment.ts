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
  runTransaction,
  limit
} from "firebase/firestore";
import { Candidate, Job, Employee } from "@/types";
import { autoAssignOnboardingTrainings } from "./trainings";

const JOBS_COLLECTION = "jobs";
const CANDIDATES_COLLECTION = "candidates";
const EMPLOYEES_COLLECTION = "employees";

// Jobs Service
export const getActiveJobs = async (): Promise<Job[]> => {
  const col = collection(db, JOBS_COLLECTION);
  const q = query(col, where("status", "==", "open"), orderBy("title"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
};

export const createJob = async (job: Omit<Job, 'id'>): Promise<string> => {
  const col = collection(db, JOBS_COLLECTION);
  const docRef = await addDoc(col, job);
  return docRef.id;
};

// Candidates Service
export const getAllCandidates = async (jobId?: string): Promise<Candidate[]> => {
  const col = collection(db, CANDIDATES_COLLECTION);
  let q = query(col, orderBy("firstName", "asc"));
  if (jobId) q = query(q, where("jobId", "==", jobId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidate));
};

export const updateCandidateStage = async (candidateId: string, stage: Candidate['stage']): Promise<void> => {
  const docRef = doc(db, CANDIDATES_COLLECTION, candidateId);
  await updateDoc(docRef, { stage });
};

export const addCandidate = async (candidate: Omit<Candidate, 'id'>): Promise<string> => {
  const col = collection(db, CANDIDATES_COLLECTION);
  const docRef = await addDoc(col, candidate);
  return docRef.id;
};

// Logic: Hire Candidate -> Convert to Employee
export const hireCandidate = async (candidateId: string, jobId: string): Promise<string> => {
  const employeeId = await runTransaction(db, async (transaction) => {
    const candidateRef = doc(db, CANDIDATES_COLLECTION, candidateId);
    const candidateSnap = await transaction.get(candidateRef);
    
    if (!candidateSnap.exists()) throw new Error("Kandydat nie istnieje.");
    const candidate = candidateSnap.data() as Candidate;

    if (candidate.stage === 'hired') throw new Error("Kandydat został już zatrudniony.");

    // 1. Update candidate status
    transaction.update(candidateRef, { stage: 'hired' });

    // 2. Create new employee record
    const employeesCol = collection(db, EMPLOYEES_COLLECTION);
    const newEmployeeRef = doc(employeesCol);
    
    const newEmployee: Omit<Employee, 'id'> = {
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      departmentId: "DEPT-NEW", // Default for onboarding
      positionId: "POS-NEW", // Should ideally come from Job
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      metadata: {
        source: 'ATS',
        hiredFromJobId: jobId,
        candidateId: candidateId
      }
    };

    transaction.set(newEmployeeRef, newEmployee);
    
    return newEmployeeRef.id;
  });

  // 3. Auto-assign onboarding trainings
  try {
    await autoAssignOnboardingTrainings(employeeId);
  } catch (err) {
    console.error("Failed to auto-assign trainings:", err);
  }

  return employeeId;
};

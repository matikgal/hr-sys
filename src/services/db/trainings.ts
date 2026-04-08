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
  writeBatch
} from "firebase/firestore";
import { Training, EmployeeTraining } from "@/types";
import { addDays, format } from "date-fns";

const TRAININGS_COL = "trainings";
const EMP_TRAININGS_COL = "employee_trainings";

export const getAvailableTrainings = async (): Promise<Training[]> => {
  const col = collection(db, TRAININGS_COL);
  const snapshot = await getDocs(query(col, orderBy("title")));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Training));
};

export const getEmployeeTrainings = async (employeeId: string): Promise<EmployeeTraining[]> => {
  const col = collection(db, EMP_TRAININGS_COL);
  const q = query(col, where("employeeId", "==", employeeId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmployeeTraining));
};

export const autoAssignOnboardingTrainings = async (employeeId: string): Promise<void> => {
  const trainings = await getAvailableTrainings();
  const onboardingTrainings = trainings.filter(t => t.mandatory);
  
  if (onboardingTrainings.length === 0) return;

  const batch = writeBatch(db);
  const empTrainingsCol = collection(db, EMP_TRAININGS_COL);

  onboardingTrainings.forEach(training => {
    const newDocRef = doc(empTrainingsCol);
    const assignment: Omit<EmployeeTraining, 'id'> = {
      employeeId,
      trainingId: training.id,
      completedDate: "",
      expiryDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'), // 30 days to complete
      status: 'pending'
    };
    batch.set(newDocRef, assignment);
  });

  await batch.commit();
};

export const completeTraining = async (assignmentId: string, employeeId: string, trainingId: string): Promise<void> => {
  const docRef = doc(db, EMP_TRAININGS_COL, assignmentId);
  const trainingRef = doc(db, TRAININGS_COL, trainingId);
  const trainingSnap = await getDoc(trainingRef);
  
  if (!trainingSnap.exists()) throw new Error("Szkolenie nie istnieje.");
  const training = trainingSnap.data() as Training;

  const completedDate = format(new Date(), 'yyyy-MM-dd');
  const expiryDate = training.validityMonths > 0 
    ? format(addDays(new Date(), training.validityMonths * 30), 'yyyy-MM-dd')
    : "";

  await updateDoc(docRef, {
    status: 'completed',
    completedDate,
    expiryDate
  });

  // Integration with Module 2: Update employee notes
  const empRef = doc(db, "employees", employeeId);
  const empSnap = await getDoc(empRef);
  if (empSnap.exists()) {
    const currentData = empSnap.data();
    const currentNotes = currentData.metadata?.notes || [];
    await updateDoc(empRef, {
      "metadata.notes": [...currentNotes, `Ukończono szkolenie: ${training.title} w dniu ${completedDate}`]
    });
  }
};

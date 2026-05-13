import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { Training, EmployeeTraining } from "@/types";
import { addDays, format } from "date-fns";

const TRAININGS_COL = "trainings";
const EMP_TRAININGS_COL = "employee_trainings";

export const getAvailableTrainings = async (): Promise<Training[]> => {
  const col = collection(db, TRAININGS_COL);
  const snapshot = await getDocs(query(col, orderBy("title")));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Training));
};

export const createTraining = async (
  data: Omit<Training, "id">
): Promise<string> => {
  const ref = await addDoc(collection(db, TRAININGS_COL), data);
  return ref.id;
};

export const deleteTraining = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, TRAININGS_COL, id));
};

export const getEmployeeTrainings = async (
  employeeId: string
): Promise<EmployeeTraining[]> => {
  const col = collection(db, EMP_TRAININGS_COL);
  const q = query(col, where("employeeId", "==", employeeId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as EmployeeTraining));
};

export const getAllEmployeeTrainings = async (): Promise<EmployeeTraining[]> => {
  const snapshot = await getDocs(collection(db, EMP_TRAININGS_COL));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as EmployeeTraining));
};

export const enrollInTraining = async (
  employeeId: string,
  trainingId: string
): Promise<string> => {
  const trainingSnap = await getDoc(doc(db, TRAININGS_COL, trainingId));
  if (!trainingSnap.exists()) throw new Error("Szkolenie nie istnieje.");
  const training = trainingSnap.data() as Training;

  const expiryDate =
    training.validityMonths > 0
      ? format(addDays(new Date(), training.validityMonths * 30), "yyyy-MM-dd")
      : format(addDays(new Date(), 365), "yyyy-MM-dd");

  const assignment: Omit<EmployeeTraining, "id"> = {
    employeeId,
    trainingId,
    completedDate: "",
    expiryDate,
    status: "pending",
  };

  const ref = await addDoc(collection(db, EMP_TRAININGS_COL), assignment);
  return ref.id;
};

export const autoAssignOnboardingTrainings = async (
  employeeId: string
): Promise<void> => {
  const trainings = await getAvailableTrainings();
  const onboardingTrainings = trainings.filter(t => t.mandatory);

  if (onboardingTrainings.length === 0) return;

  const batch = writeBatch(db);
  const empTrainingsCol = collection(db, EMP_TRAININGS_COL);

  onboardingTrainings.forEach(training => {
    const newDocRef = doc(empTrainingsCol);
    const assignment: Omit<EmployeeTraining, "id"> = {
      employeeId,
      trainingId: training.id,
      completedDate: "",
      expiryDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
      status: "pending",
    };
    batch.set(newDocRef, assignment);
  });

  await batch.commit();
};

export const completeTraining = async (
  assignmentId: string,
  employeeId: string,
  trainingId: string
): Promise<void> => {
  const docRef = doc(db, EMP_TRAININGS_COL, assignmentId);
  const trainingRef = doc(db, TRAININGS_COL, trainingId);
  const trainingSnap = await getDoc(trainingRef);

  if (!trainingSnap.exists()) throw new Error("Szkolenie nie istnieje.");
  const training = trainingSnap.data() as Training;

  const completedDate = format(new Date(), "yyyy-MM-dd");
  const expiryDate =
    training.validityMonths > 0
      ? format(
          addDays(new Date(), training.validityMonths * 30),
          "yyyy-MM-dd"
        )
      : "";

  await updateDoc(docRef, {
    status: "completed",
    completedDate,
    expiryDate,
  });

  const empRef = doc(db, "employees", employeeId);
  const empSnap = await getDoc(empRef);
  if (empSnap.exists()) {
    const currentData = empSnap.data();
    const currentNotes = currentData.metadata?.notes || [];
    await updateDoc(empRef, {
      "metadata.notes": [
        ...currentNotes,
        `Ukończono szkolenie: ${training.title} w dniu ${completedDate}`,
      ],
    });
  }
};

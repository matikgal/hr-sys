import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { Task } from "@/types";

const COL = "tasks";

export const getAllTasks = async (): Promise<Task[]> => {
  const snapshot = await getDocs(collection(db, COL));
  return snapshot.docs
    .map(d => ({ id: d.id, ...d.data() } as Task))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
};

export const getMyTasks = async (email: string): Promise<Task[]> => {
  const q = query(collection(db, COL), where("assigneeEmail", "==", email));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(d => ({ id: d.id, ...d.data() } as Task))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
};

export const createTask = async (task: Omit<Task, 'id'>): Promise<string> => {
  const ref = await addDoc(collection(db, COL), task);
  return ref.id;
};

export const updateTaskStatus = async (taskId: string, status: Task['status']): Promise<void> => {
  await updateDoc(doc(db, COL, taskId), { status });
};

export const deleteTask = async (taskId: string): Promise<void> => {
  await deleteDoc(doc(db, COL, taskId));
};

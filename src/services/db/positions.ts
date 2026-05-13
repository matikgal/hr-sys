import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, query } from "firebase/firestore";
import { Position } from "@/types";

const COLLECTION = "positions";

export const getPositions = async (): Promise<Position[]> => {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy("name")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Position));
};

export const addPosition = async (position: Omit<Position, 'id'>): Promise<string> => {
  const ref = await addDoc(collection(db, COLLECTION), position);
  return ref.id;
};

export const updatePosition = async (id: string, data: Partial<Omit<Position, 'id'>>): Promise<void> => {
  await updateDoc(doc(db, COLLECTION, id), data);
};

export const deletePosition = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, id));
};

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
  limit 
} from "firebase/firestore";
import { Review } from "@/types";

const COLLECTION_NAME = "reviews";

export const getEmployeeReviews = async (employeeId: string): Promise<Review[]> => {
  const col = collection(db, COLLECTION_NAME);
  const q = query(col, where("employeeId", "==", employeeId), orderBy("period", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
};

export const getAllReviews = async (): Promise<Review[]> => {
  const col = collection(db, COLLECTION_NAME);
  const q = query(col, orderBy("period", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
};

export const submitReview = async (review: Omit<Review, 'id'>): Promise<string> => {
  const col = collection(db, COLLECTION_NAME);
  const docRef = await addDoc(col, review);
  return docRef.id;
};

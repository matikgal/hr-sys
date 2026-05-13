import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { Review } from "@/types";

const COLLECTION_NAME = "reviews";

export const getEmployeeReviews = async (email: string): Promise<Review[]> => {
  const col = collection(db, COLLECTION_NAME);
  const q = query(
    col,
    where("revieweeEmail", "==", email),
    where("status", "==", "submitted"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Review))
    .sort((a, b) => (b.period ?? '').localeCompare(a.period ?? ''));
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

import { db, storage } from '@/lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  updateDoc,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import type { HRDocument } from '@/types';

const COLLECTION = 'documents';

export async function uploadDocument(
  file: File,
  uploadedBy: string,
  employeeId?: string,
  onProgress?: (pct: number) => void
): Promise<HRDocument> {
  const storagePath = `documents/${uploadedBy}/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, storagePath);

  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    task.on(
      'state_changed',
      (snap) => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      () => resolve()
    );
  });

  const downloadURL = await getDownloadURL(storageRef);

  const ext = file.name.split('.').pop()?.toUpperCase() ?? 'FILE';
  const docData = {
    name: file.name,
    type: ext,
    size: file.size,
    storagePath,
    downloadURL,
    uploadedBy,
    employeeId: employeeId ?? undefined,
    status: 'available' as const,
    createdAt: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, COLLECTION), docData);
  return { id: docRef.id, ...docData };
}

export async function getDocuments(): Promise<HRDocument[]> {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as HRDocument));
}

export async function deleteDocument(id: string, storagePath: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
  const storageRef = ref(storage, storagePath);
  await deleteObject(storageRef);
}

export async function updateDocumentStatus(
  id: string,
  status: HRDocument['status']
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { status });
}

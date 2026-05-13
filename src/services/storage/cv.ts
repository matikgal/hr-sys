import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const uploadCV = async (file: File, candidateEmail: string): Promise<string> => {
  const path = `cvs/${candidateEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: 'application/pdf' });
  return getDownloadURL(storageRef);
};

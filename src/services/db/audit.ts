import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { AuditLog } from "@/types";

const COLLECTION = "audit_log";

export const logAudit = async (entry: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void> => {
  try {
    await addDoc(collection(db, COLLECTION), {
      ...entry,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
};

export const getAuditLog = async (options?: {
  module?: AuditLog['module'];
  actorId?: string;
  limit?: number;
}): Promise<AuditLog[]> => {
  let q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"), limit(options?.limit ?? 100));
  if (options?.module) q = query(q, where("module", "==", options.module));
  if (options?.actorId) q = query(q, where("actorId", "==", options.actorId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog));
};

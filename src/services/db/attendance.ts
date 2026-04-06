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
  Timestamp,
  arrayUnion
} from "firebase/firestore";
import { Attendance } from "@/types";

const COLLECTION_NAME = "attendance";

export const getTodayAttendance = async (employeeId: string): Promise<Attendance | null> => {
  const today = new Date().toISOString().split('T')[0];
  const col = collection(db, COLLECTION_NAME);
  const q = query(
    col, 
    where("employeeId", "==", employeeId), 
    where("date", "==", today),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Attendance;
};

export const clockIn = async (employeeId: string, employeeName: string): Promise<string> => {
  const today = new Date().toISOString().split('T')[0];
  const col = collection(db, COLLECTION_NAME);
  
  // Check if record for today already exists
  const q = query(
    col, 
    where("employeeId", "==", employeeId), 
    where("date", "==", today),
    limit(1)
  );
  
  const snapshot = await getDocs(q);
  const inEvent = {
    type: 'in' as const,
    timestamp: Date.now(),
    location: 'Web App'
  };

  if (!snapshot.empty) {
    const docId = snapshot.docs[0].id;
    const data = snapshot.docs[0].data() as Attendance;
    const docRef = doc(db, COLLECTION_NAME, docId);
    
    await updateDoc(docRef, {
      events: [...data.events, inEvent],
      status: 'present'
    });
    return docId;
  }
  
  const newRecord: Omit<Attendance, 'id'> = {
    employeeId,
    employeeName,
    date: today,
    events: [inEvent],
    totalHours: 0,
    status: 'present'
  };
  
  const docRef = await addDoc(col, newRecord);
  return docRef.id;
};

export const clockOut = async (recordId: string, currentEvents: Attendance['events']): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, recordId);
  
  const outEvent = {
    type: 'out' as const,
    timestamp: Date.now(),
    location: 'Web App'
  };

  const updatedEvents = [...currentEvents, outEvent];
  
  // Calculate total hours
  let totalMs = 0;
  for (let i = 0; i < updatedEvents.length; i += 2) {
    const start = updatedEvents[i];
    const end = updatedEvents[i+1];
    if (start && end) {
      totalMs += (end.timestamp - start.timestamp);
    }
  }
  
  const totalHours = parseFloat((totalMs / (1000 * 60 * 60)).toFixed(2));

  await updateDoc(docRef, {
    events: updatedEvents,
    totalHours: totalHours
  });
};

export const getEmployeeAttendanceHistory = async (employeeId: string, limitCount: number = 30): Promise<Attendance[]> => {
  const col = collection(db, COLLECTION_NAME);
  const q = query(
    col, 
    where("employeeId", "==", employeeId), 
    orderBy("date", "desc"), 
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance));
};

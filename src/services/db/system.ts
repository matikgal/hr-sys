import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  getDoc,
  doc,
  addDoc, 
  query, 
  orderBy,
  where,
  limit,
  DocumentData,
  QueryDocumentSnapshot,
  getCountFromServer
} from "firebase/firestore";
import { Department, Attendance, Candidate, Job, Leave, Employee, EmployeeTraining } from "@/types";
import { format, subDays, startOfDay, parseISO, differenceInDays } from 'date-fns';

// Dashboard Aggregation
export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  pendingLeaves: number;
  activeRecruitments: number;
  anomalies: {
    type: 'late' | 'missing_out';
    employeeName: string;
    description: string;
  }[];
  chartData: {
    name: string;
    hours: number;
  }[];
  recentActivity: {
    id: string;
    type: 'attendance' | 'leave';
    user: string;
    action: string;
    time: string;
  }[];
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const employeesCol = collection(db, "employees");
  const attendanceCol = collection(db, "attendance");
  const leavesCol = collection(db, "leaves");
  const candidatesCol = collection(db, "candidates");

  // 1. Basic Stats
  const empCount = await getCountFromServer(employeesCol);
  const candCount = await getCountFromServer(query(candidatesCol, where("stage", "!=", "rejected")));
  
  const todayAttendanceQ = query(attendanceCol, where("date", "==", today));
  const todayAttendanceSnap = await getDocs(todayAttendanceQ);
  const presentToday = todayAttendanceSnap.size;

  const pendingLeavesQ = query(leavesCol, where("status", "==", "pending"));
  const pendingLeavesSnap = await getDocs(pendingLeavesQ);
  const pendingLeaves = pendingLeavesSnap.size;

  // 2. Anomalies & Alerts
  const anomalies: DashboardStats['anomalies'] = [];
  
  // Late arrivals
  todayAttendanceSnap.docs.forEach(doc => {
    const data = doc.data() as Attendance;
    const firstIn = data.events.find(e => e.type === 'in');
    if (firstIn) {
      const loginTime = new Date(firstIn.timestamp);
      const expectedTime = new Date(loginTime);
      expectedTime.setHours(9, 15, 0, 0); 
      if (loginTime > expectedTime) {
        anomalies.push({
          type: 'late',
          employeeName: data.employeeName,
          description: `Spóźnienie: logowanie o ${format(loginTime, 'HH:mm')}`
        });
      }
    }
  });

  // Training Expiry Alerts (Last 14 days)
  const empTrainingsCol = collection(db, "employee_trainings");
  const expiringTrainingsQ = query(empTrainingsCol, where("status", "==", "pending"));
  const expiringSnap = await getDocs(expiringTrainingsQ);
  
  expiringSnap.docs.forEach(doc => {
    const data = doc.data() as EmployeeTraining;
    if (data.expiryDate) {
      const daysLeft = differenceInDays(parseISO(data.expiryDate), new Date());
      if (daysLeft >= 0 && daysLeft <= 14) {
        anomalies.push({
          type: 'late', 
          employeeName: `Szkolenie: ID ${data.trainingId.substring(0, 8)}`,
          description: `Wymagane ukończenie za ${daysLeft} dni.`
        });
      }
    }
  });

  // Upcoming Reviews
  const reviewsCol = collection(db, "reviews");
  const draftReviewsQ = query(reviewsCol, where("status", "==", "draft"));
  const draftsSnap = await getDocs(draftReviewsQ);
  if (draftsSnap.size > 0) {
    anomalies.push({
      type: 'missing_out',
      employeeName: "System Ocen",
      description: `Masz ${draftsSnap.size} oczekujących arkuszy ocen do uzupełnienia.`
    });
  }

  // 3. Chart Data (Last 7 Days)
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const dayLabel = format(subDays(new Date(), i), 'EEE');
    const dayAttendanceQ = query(attendanceCol, where("date", "==", date));
    const daySnap = await getDocs(dayAttendanceQ);
    
    let totalHours = 0;
    daySnap.docs.forEach(d => {
      totalHours += (d.data() as Attendance).totalHours || 0;
    });

    chartData.push({
      name: dayLabel,
      hours: parseFloat(totalHours.toFixed(1))
    });
  }

  // 4. Recent Activity
  const recentActivity: DashboardStats['recentActivity'] = [];
  
  // Recent attendance
  const recentAttendQ = query(attendanceCol, orderBy("date", "desc"), limit(5));
  const recentAttendSnap = await getDocs(recentAttendQ);
  recentAttendSnap.docs.forEach(doc => {
    const data = doc.data() as Attendance;
    const lastEvent = data.events[data.events.length - 1];
    if (lastEvent) {
      recentActivity.push({
        id: doc.id,
        type: 'attendance',
        user: data.employeeName,
        action: lastEvent.type === 'in' ? 'Rozpoczął pracę' : 'Zakończył pracę',
        time: format(lastEvent.timestamp, 'HH:mm (dd.MM)')
      });
    }
  });

  // Recent leaves
  const recentLeavesQ = query(leavesCol, orderBy("createdAt", "desc"), limit(5));
  const recentLeavesSnap = await getDocs(recentLeavesQ);
  recentLeavesSnap.docs.forEach(doc => {
    const data = doc.data() as Leave;
    recentActivity.push({
      id: doc.id,
      type: 'leave',
      user: data.employeeName || 'Pracownik',
      action: `Złożył wniosek: ${data.type}`,
      time: format(parseISO(data.createdAt), 'HH:mm (dd.MM)')
    });
  });

  // Sort and limit activity
  const sortedActivity = recentActivity
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, 5);

  return {
    totalEmployees: empCount.data().count,
    presentToday,
    pendingLeaves,
    activeRecruitments: candCount.data().count,
    anomalies,
    chartData,
    recentActivity: sortedActivity
  };
};

// Departments Service
export const getDepartments = async (): Promise<Department[]> => {
  const col = collection(db, "departments");
  const snapshot = await getDocs(query(col, orderBy("name")));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
};

export const getDepartmentById = async (id: string): Promise<Department | null> => {
  const docRef = doc(db, "departments", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Department;
  }
  return null;
};

// Attendance Service
export const getAttendance = async (date?: string): Promise<Attendance[]> => {
  const col = collection(db, "attendance");
  let q = query(col, orderBy("date", "desc"), limit(100));
  if (date) q = query(col, where("date", "==", date));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance));
};

// Recruitment Service
export const getCandidates = async (): Promise<Candidate[]> => {
  const col = collection(db, "candidates");
  const snapshot = await getDocs(query(col, orderBy("lastName", "asc")));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Candidate));
};

// Documents Service
export const getDocuments = async (employeeId?: string): Promise<any[]> => {
  const col = collection(db, "documents");
  let q = query(col, orderBy("createdAt", "desc"));
  if (employeeId) q = query(col, where("employeeId", "==", employeeId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
};

// Bulk add functions (for seed)
export const bulkAdd = async (collectionName: string, items: any[]) => {
  const col = collection(db, collectionName);
  const promises = items.map(item => addDoc(col, item));
  return Promise.all(promises);
};



export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'hr' | 'manager' | 'employee';
}

export interface Employee {
  id: string;
  authId?: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string;
  positionId: string;
  status: 'active' | 'inactive' | 'on-leave';
  startDate: string;
  metadata?: {
    skills?: string[];
    languages?: string[];
    [key: string]: any;
  };
}

export interface Department {
  id: string;
  name: string;
  managerId?: string;
  description?: string;
}

export interface JobHistory {
  id: string;
  position: string;
  startDate: string;
  endDate?: string;
  salary: number;
}

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  events: {
    type: 'in' | 'out';
    timestamp: number;
    location?: string;
  }[];
  totalHours: number;
  status: 'present' | 'absent' | 'late' | 'excused';
}

export interface Leave {
  id: string;
  employeeId: string;
  employeeName?: string;
  type: 'vacation' | 'sick' | 'paternity' | 'unpaid';
  startDate: string;
  endDate: string;
  daysCount: number;
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  approverId?: string;
  createdAt: string;
}

export interface LeaveBalance {
  employeeId: string;
  vacationTotal: number;
  vacationUsed: number;
  sickUsed: number;
}

export interface Job {
  id: string;
  title: string;
  departmentId: string;
  status: 'open' | 'closed';
}

export interface Candidate {
  id: string;
  jobId: string;
  firstName: string;
  lastName: string;
  email: string;
  stage: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  score: number;
}

export interface Review {
  id: string;
  employeeId: string;
  reviewerId: string;
  period: string; // e.g. '2026-Q1'
  ratings: Record<string, number>;
  comments: string;
  status: 'draft' | 'submitted';
  date: string;
}

export interface Training {
  id: string;
  title: string;
  mandatory: boolean;
  validityMonths: number;
}

export interface EmployeeTraining {
  id: string;
  employeeId: string;
  trainingId: string;
  completedDate: string;
  expiryDate: string;
  status: 'completed' | 'expired' | 'pending';
}

export interface Benefit {
  id: string;
  name: string;
  provider: string;
  monthlyCost: number;
}

export interface EmployeeBenefit {
  employeeId: string;
  benefitIds: string[];
}

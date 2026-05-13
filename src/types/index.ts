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
  avatarUrl?: string;
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
  salaryRange?: string;
  description?: string;
}

export interface Candidate {
  id: string;
  jobId: string;
  firstName: string;
  lastName: string;
  email: string;
  stage: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  score: number;
  notes?: string;
  phone?: string;
  cvUrl?: string;
  appliedAt?: string;
}

export interface Review {
  id: string;
  employeeId: string;
  revieweeEmail: string;
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

export interface HRDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  storagePath: string;
  downloadURL: string;
  uploadedBy: string;
  employeeId?: string;
  status: 'available' | 'pending' | 'signed';
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigneeId: string;
  assigneeEmail: string;
  assignerId: string;
  assignerName: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'done';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  module: 'employees' | 'leaves' | 'recruitment' | 'trainings' | 'benefits' | 'documents' | 'settings' | 'attendance';
  actorId: string;
  actorName: string;
  targetId?: string;
  targetName?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  createdAt: string;
}

export interface Position {
  id: string;
  name: string;
  departmentId?: string;
  level?: 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director';
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantAvatars: Record<string, string>;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  lastMessageSenderId?: string | null;
  unreadCounts: Record<string, number>;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string | null;
}

export interface UserSettings {
  uid: string;
  displayName: string;
  theme: 'light' | 'dark' | 'system';
  language: 'pl' | 'en';
  companyName: string;
}

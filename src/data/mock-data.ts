import { Employee, User } from '@/types';

export const MOCK_USER: User = {
  uid: 'u1',
  email: 'marcin.kowalski@hrnexus.pl',
  displayName: 'Marcin Kowalski',
  photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcin',
  role: 'admin',
};

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    firstName: 'Anna',
    lastName: 'Nowak',
    email: 'anna.nowak@hrnexus.pl',
    department: 'Marketing',
    position: 'Senior Specialist',
    startDate: '2022-03-15',
    status: 'active',
  },
  {
    id: 'emp-2',
    firstName: 'Piotr',
    lastName: 'Zieliński',
    email: 'piotr.zielinski@hrnexus.pl',
    department: 'Engineering',
    position: 'Frontend Developer',
    startDate: '2023-01-10',
    status: 'active',
  },
  {
    id: 'emp-3',
    firstName: 'Katarzyna',
    lastName: 'Wiśniewska',
    email: 'k.wisniewska@hrnexus.pl',
    department: 'HR',
    position: 'HR Business Partner',
    startDate: '2021-06-20',
    status: 'on-leave',
  },
  {
    id: 'emp-4',
    firstName: 'Michał',
    lastName: 'Lewandowski',
    email: 'm.lewandowski@hrnexus.pl',
    department: 'Sales',
    position: 'Account Manager',
    startDate: '2023-05-04',
    status: 'active',
  },
  {
    id: 'emp-5',
    firstName: 'Magdalena',
    lastName: 'Wójcik',
    email: 'm.wojcik@hrnexus.pl',
    department: 'Engineering',
    position: 'QA Engineer',
    startDate: '2022-11-12',
    status: 'inactive',
  },
  {
    id: 'emp-6',
    firstName: 'Tomasz',
    lastName: 'Mazur',
    email: 't.mazur@hrnexus.pl',
    department: 'Finance',
    position: 'Financial Analyst',
    startDate: '2020-09-01',
    status: 'active',
  },
];

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'Vacation' | 'Sick Leave' | 'Remote Work' | 'Maternity';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
}

export const MOCK_LEAVES: LeaveRequest[] = [
  {
    id: 'lv-1',
    employeeId: 'emp-1',
    employeeName: 'Anna Nowak',
    type: 'Vacation',
    startDate: '2026-05-10',
    endDate: '2026-05-20',
    status: 'pending',
    reason: 'Zaległy urlop wypoczynkowy',
  },
  {
    id: 'lv-2',
    employeeId: 'emp-2',
    employeeName: 'Piotr Zieliński',
    type: 'Remote Work',
    startDate: '2026-04-15',
    endDate: '2026-04-16',
    status: 'approved',
    reason: 'Praca zdalna - sprawy rodzinne',
  },
  {
    id: 'lv-3',
    employeeId: 'emp-3',
    employeeName: 'Katarzyna Wiśniewska',
    type: 'Sick Leave',
    startDate: '2026-04-10',
    endDate: '2026-04-14',
    status: 'approved',
    reason: 'Zwolnienie lekarskie',
  },
];

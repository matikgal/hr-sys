export const queryKeys = {
  employees: {
    all: ['employees'] as const,
    list: (filters?: object) => ['employees', 'list', filters] as const,
    detail: (id: string) => ['employees', 'detail', id] as const,
  },
  departments: {
    all: ['departments'] as const,
  },
  attendance: {
    today: (employeeId: string) => ['attendance', 'today', employeeId] as const,
    history: (employeeId: string) => ['attendance', 'history', employeeId] as const,
    all: ['attendance', 'all'] as const,
  },
  leaves: {
    all: ['leaves'] as const,
    balance: (employeeId: string) => ['leaves', 'balance', employeeId] as const,
  },
  recruitment: {
    jobs: ['recruitment', 'jobs'] as const,
    candidates: (jobId?: string) => ['recruitment', 'candidates', jobId] as const,
  },
  performance: {
    all: ['performance'] as const,
    byEmployee: (employeeId: string) => ['performance', employeeId] as const,
  },
  learning: {
    all: ['learning', 'all'] as const,
    employee: (employeeId: string) => ['learning', 'employee', employeeId] as const,
  },
  benefits: {
    catalog: ['benefits', 'catalog'] as const,
    employee: (employeeId: string) => ['benefits', 'employee', employeeId] as const,
  },
  documents: {
    all: ['documents'] as const,
  },
  settings: {
    user: (uid: string) => ['settings', uid] as const,
  },
  system: {
    stats: ['system', 'stats'] as const,
    departments: ['system', 'departments'] as const,
  },
} as const;

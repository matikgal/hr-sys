import { z } from 'zod';

export const UserRoleSchema = z.enum(['admin', 'hr', 'manager', 'employee']);

export const UserSchema = z.object({
  uid: z.string(),
  email: z.string().email().nullable(),
  displayName: z.string().nullable(),
  photoURL: z.string().nullable(),
  role: UserRoleSchema,
});

export const EmployeeStatusSchema = z.enum(['active', 'inactive', 'on-leave']);

export const EmployeeSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(2, "Imię musi mieć co najmniej 2 znaki"),
  lastName: z.string().min(2, "Nazwisko musi mieć co najmniej 2 znaki"),
  email: z.string().email("Niepoprawny format adresu email"),
  department: z.string().min(1, "Wymagany dział"),
  position: z.string().min(1, "Wymagane stanowisko"),
  startDate: z.string(),
  status: EmployeeStatusSchema,
});

export type EmployeeInput = z.infer<typeof EmployeeSchema>;

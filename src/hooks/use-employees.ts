import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllEmployees, addEmployee, getEmployeeByAuthId } from '@/services/db/employees';
import { getDepartments } from '@/services/db/system';
import { queryKeys } from '@/lib/query-keys';
import type { Employee } from '@/types';

export function useEmployees(filters?: Parameters<typeof getAllEmployees>[0]) {
  return useQuery({
    queryKey: queryKeys.employees.list(filters),
    queryFn: () => getAllEmployees(filters),
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.system.departments,
    queryFn: getDepartments,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEmployeeByAuthId(uid: string | undefined) {
  return useQuery({
    queryKey: queryKeys.employees.detail(uid ?? ''),
    queryFn: () => getEmployeeByAuthId(uid!),
    enabled: !!uid,
  });
}

export function useAddEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Employee, 'id'>) => addEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
}

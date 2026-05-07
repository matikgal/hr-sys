import { useQuery } from '@tanstack/react-query';
import { getAvailableTrainings, getEmployeeTrainings } from '@/services/db/trainings';
import { queryKeys } from '@/lib/query-keys';

export function useTrainings() {
  return useQuery({
    queryKey: queryKeys.learning.all,
    queryFn: getAvailableTrainings,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEmployeeTrainings(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.learning.employee(employeeId ?? ''),
    queryFn: () => getEmployeeTrainings(employeeId!),
    enabled: !!employeeId,
  });
}

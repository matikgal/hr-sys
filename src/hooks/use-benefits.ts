import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAvailableBenefits, getEmployeeBenefits,
  enrollInBenefit, unenrollFromBenefit,
} from '@/services/db/benefits';
import { queryKeys } from '@/lib/query-keys';

export function useBenefitsCatalog() {
  return useQuery({
    queryKey: queryKeys.benefits.catalog,
    queryFn: getAvailableBenefits,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEmployeeBenefits(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.benefits.employee(employeeId ?? ''),
    queryFn: () => getEmployeeBenefits(employeeId!),
    enabled: !!employeeId,
  });
}

export function useEnrollBenefit(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (benefitId: string) => enrollInBenefit(employeeId, benefitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.benefits.employee(employeeId) });
    },
  });
}

export function useUnenrollBenefit(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (benefitId: string) => unenrollFromBenefit(employeeId, benefitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.benefits.employee(employeeId) });
    },
  });
}

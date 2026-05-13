import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAvailableBenefits, getEmployeeBenefits,
  enrollInBenefit, unenrollFromBenefit,
  createBenefit, deleteBenefit
} from '@/services/db/benefits';
import { queryKeys } from '@/lib/query-keys';
import { Benefit } from '@/types';

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

export const useUnenrollBenefit = (employeeId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (benefitId: string) => unenrollFromBenefit(employeeId, benefitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.benefits.employee(employeeId) });
    },
  });
};

export const useCreateBenefit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Benefit, "id">) => createBenefit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.benefits.catalog });
    },
  });
};

export const useDeleteBenefit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (benefitId: string) => deleteBenefit(benefitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.benefits.catalog });
    },
  });
};

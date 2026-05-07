import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboardStats } from '@/services/db/system';
import { getAllEmployees } from '@/services/db/employees';
import { getPendingLeaves, approveLeave, rejectLeave } from '@/services/db/leaves';
import { queryKeys } from '@/lib/query-keys';

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.system.stats,
    queryFn: getDashboardStats,
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useDashboardEmployees() {
  return useQuery({
    queryKey: queryKeys.employees.list({ limit: 8 }),
    queryFn: () => getAllEmployees({ limit: 8 }),
    staleTime: 2 * 60 * 1000,
  });
}

export function usePendingLeaves() {
  return useQuery({
    queryKey: ['leaves', 'pending'],
    queryFn: () => getPendingLeaves(5),
    staleTime: 30 * 1000,
  });
}

export function useApproveLeaveDashboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leaveId, approverId }: { leaveId: string; approverId: string }) =>
      approveLeave(leaveId, approverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves', 'pending'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.system.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.all });
    },
  });
}

export function useRejectLeaveDashboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leaveId, approverId }: { leaveId: string; approverId: string }) =>
      rejectLeave(leaveId, approverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves', 'pending'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.system.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.all });
    },
  });
}

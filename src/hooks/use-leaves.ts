import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllLeaves, getLeaveBalance, requestLeave, approveLeave, rejectLeave } from '@/services/db/leaves';
import { queryKeys } from '@/lib/query-keys';
import type { Leave } from '@/types';

export function useLeaves() {
  return useQuery({
    queryKey: queryKeys.leaves.all,
    queryFn: getAllLeaves,
  });
}

export function useLeaveBalance(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.leaves.balance(employeeId ?? ''),
    queryFn: () => getLeaveBalance(employeeId!),
    enabled: !!employeeId,
  });
}

export function useRequestLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Leave, 'id' | 'status' | 'approverId'>) => requestLeave(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.all });
    },
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leaveId, approverId }: { leaveId: string; approverId: string }) =>
      approveLeave(leaveId, approverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.all });
    },
  });
}

export function useRejectLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leaveId, approverId }: { leaveId: string; approverId: string }) =>
      rejectLeave(leaveId, approverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.all });
    },
  });
}

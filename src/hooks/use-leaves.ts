import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllLeaves, getEmployeeLeaves, getLeaveBalance, requestLeave, approveLeave, rejectLeave } from '@/services/db/leaves';
import { queryKeys } from '@/lib/query-keys';
import type { Leave } from '@/types';

export function useLeaves(employeeId?: string, role?: string) {
  const isPrivileged = role === 'admin' || role === 'hr' || role === 'manager';
  return useQuery({
    queryKey: isPrivileged ? queryKeys.leaves.all : queryKeys.leaves.employee(employeeId ?? ''),
    queryFn: isPrivileged ? getAllLeaves : () => getEmployeeLeaves(employeeId!),
    enabled: isPrivileged ? true : !!employeeId,
  });
}

export function useLeaveBalance(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.leaves.balance(employeeId ?? ''),
    queryFn: () => getLeaveBalance(employeeId!),
    enabled: !!employeeId,
  });
}

export function useRequestLeave(employeeId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Leave, 'id' | 'status' | 'approverId'>) => requestLeave(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leaves.all });
      if (employeeId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.leaves.employee(employeeId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.leaves.balance(employeeId) });
      }
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

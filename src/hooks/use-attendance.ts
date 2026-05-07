import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTodayAttendance, clockIn, clockOut, getEmployeeAttendanceHistory,
} from '@/services/db/attendance';
import { queryKeys } from '@/lib/query-keys';
import type { Attendance } from '@/types';

export function useTodayAttendance(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.attendance.today(employeeId ?? ''),
    queryFn: () => getTodayAttendance(employeeId!),
    enabled: !!employeeId,
    staleTime: 30 * 1000,
  });
}

export function useAttendanceHistory(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.attendance.history(employeeId ?? ''),
    queryFn: () => getEmployeeAttendanceHistory(employeeId!),
    enabled: !!employeeId,
  });
}

export function useClockIn(employeeId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name }: { name: string }) => clockIn(employeeId!, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.today(employeeId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.history(employeeId!) });
    },
  });
}

export function useClockOut(employeeId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recordId, events }: { recordId: string; events: Attendance['events'] }) =>
      clockOut(recordId, events),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.today(employeeId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.history(employeeId!) });
    },
  });
}

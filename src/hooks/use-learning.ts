import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAvailableTrainings,
  getEmployeeTrainings,
  getAllEmployeeTrainings,
  createTraining,
  deleteTraining,
  enrollInTraining,
} from "@/services/db/trainings";
import { queryKeys } from "@/lib/query-keys";
import { Training } from "@/types";

export function useTrainings() {
  return useQuery({
    queryKey: queryKeys.learning.all,
    queryFn: getAvailableTrainings,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEmployeeTrainings(employeeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.learning.employee(employeeId ?? ""),
    queryFn: () => getEmployeeTrainings(employeeId!),
    enabled: !!employeeId,
  });
}

export function useAllEmployeeTrainings(enabled: boolean) {
  return useQuery({
    queryKey: ["learning", "all-assignments"],
    queryFn: getAllEmployeeTrainings,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Training, "id">) => createTraining(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.learning.all }),
  });
}

export function useDeleteTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTraining(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.learning.all }),
  });
}

export function useEnrollInTraining() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, trainingId }: { employeeId: string; trainingId: string }) =>
      enrollInTraining(employeeId, trainingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["learning"] });
    },
  });
}

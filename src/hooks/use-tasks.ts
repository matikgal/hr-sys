import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllTasks, getMyTasks, createTask, updateTaskStatus, deleteTask } from '@/services/db/tasks';
import type { Task } from '@/types';

const KEYS = {
  all: ['tasks', 'all'] as const,
  mine: (email: string) => ['tasks', 'mine', email] as const,
};

export function useAllTasks() {
  return useQuery<Task[]>({ queryKey: KEYS.all, queryFn: getAllTasks });
}

export function useMyTasks(email: string | null | undefined) {
  return useQuery<Task[]>({
    queryKey: email ? KEYS.mine(email) : KEYS.all,
    queryFn: email ? () => getMyTasks(email) : getAllTasks,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (task: Omit<Task, 'id'>) => createTask(task),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task['status'] }) => updateTaskStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

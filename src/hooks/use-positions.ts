import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPositions, addPosition, updatePosition, deletePosition } from '@/services/db/positions';
import type { Position } from '@/types';

const KEY = ['positions'];

export function usePositions() {
  return useQuery({ queryKey: KEY, queryFn: getPositions, staleTime: 5 * 60 * 1000 });
}

export function useAddPosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Position, 'id'>) => addPosition(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Position, 'id'>> }) => updatePosition(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeletePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePosition(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

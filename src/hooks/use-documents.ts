import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDocuments, uploadDocument, deleteDocument } from '@/services/db/documents';
import { queryKeys } from '@/lib/query-keys';

export function useDocuments() {
  return useQuery({
    queryKey: queryKeys.documents.all,
    queryFn: getDocuments,
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, storagePath }: { id: string; storagePath: string }) =>
      deleteDocument(id, storagePath),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
    },
  });
}

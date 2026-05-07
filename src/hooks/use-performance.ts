import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllReviews, submitReview } from '@/services/db/performance';
import { queryKeys } from '@/lib/query-keys';
import type { Review } from '@/types';

export function useReviews() {
  return useQuery({
    queryKey: queryKeys.performance.all,
    queryFn: getAllReviews,
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (review: Omit<Review, 'id'>) => submitReview(review),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.performance.all });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllReviews, getEmployeeReviews, submitReview } from '@/services/db/performance';
import { queryKeys } from '@/lib/query-keys';
import type { Review } from '@/types';

// email=null  → getAllReviews (manager+)
// email=string → getEmployeeReviews by revieweeEmail (employee)
export function useReviews(email: string | null) {
  return useQuery({
    queryKey: email ? ['reviews', 'employee', email] : queryKeys.performance.all,
    queryFn: email ? () => getEmployeeReviews(email) : getAllReviews,
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

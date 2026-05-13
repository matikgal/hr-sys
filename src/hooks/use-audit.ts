import { useQuery } from '@tanstack/react-query';
import { getAuditLog } from '@/services/db/audit';
import type { AuditLog } from '@/types';

export function useAuditLog(options?: { module?: AuditLog['module']; actorId?: string; limit?: number }) {
  return useQuery({
    queryKey: ['audit_log', options],
    queryFn: () => getAuditLog(options),
    staleTime: 30 * 1000,
  });
}

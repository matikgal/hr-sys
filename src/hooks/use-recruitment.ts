import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getActiveJobs, getAllCandidates, createJob,
  updateCandidateStage, hireCandidate, updateCandidateNotes, addCandidate,
  getCandidatesByEmail,
} from '@/services/db/recruitment';
import { getDepartments } from '@/services/db/system';
import { queryKeys } from '@/lib/query-keys';
import type { Candidate, Job, Department } from '@/types';

export function useJobs() {
  return useQuery<Job[]>({
    queryKey: queryKeys.recruitment.jobs,
    queryFn: () => getActiveJobs(),
  });
}

export function useCandidates() {
  return useQuery<Candidate[]>({
    queryKey: queryKeys.recruitment.candidates(),
    queryFn: () => getAllCandidates(),
  });
}

export function useRecruitmentDepartments() {
  return useQuery<Department[]>({
    queryKey: queryKeys.system.departments,
    queryFn: () => getDepartments(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateCandidateStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: Candidate['stage'] }) =>
      updateCandidateStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.candidates() });
    },
  });
}

export function useHireCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ candidateId, jobId }: { candidateId: string; jobId: string }) =>
      hireCandidate(candidateId, jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.candidates() });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.jobs });
    },
  });
}

export function useApplyForJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (candidate: Omit<Candidate, 'id'>) => addCandidate(candidate),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.candidates() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.myApplications(vars.email) });
    },
  });
}

export function useMyApplications(email: string | null | undefined) {
  return useQuery<Candidate[]>({
    queryKey: queryKeys.recruitment.myApplications(email),
    queryFn: () => getCandidatesByEmail(email!),
    enabled: !!email,
  });
}

export function useUpdateCandidateNotes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => updateCandidateNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.candidates() });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { Subject, SubjectSummary } from '../lib/types';

export const useSubjectsList = () => {
  return useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await api.get('/subjects');
      return res.data.subjects;
    },
  });
};

export const useStudentSubjects = (year?: string) => {
  return useQuery<Subject[]>({
    queryKey: ['studentSubjects', year],
    queryFn: async () => {
      const res = await api.get('/subjects/student', {
        params: year ? { year } : {},
      });
      return res.data.subjects;
    },
  });
};

export const useSubjectSummary = (subjectId?: string) => {
  return useQuery<SubjectSummary>({
    queryKey: ['subjectSummary', subjectId],
    queryFn: async () => {
      if (!subjectId) throw new Error('No subjectId provided');
      const res = await api.get(`/subjects/${subjectId}/summary`);
      return res.data.summary;
    },
    enabled: !!subjectId,
  });
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Subject, '_id' | 'status'>) => {
      const res = await api.post('/subjects', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
};

export const useToggleSubjectStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: number }) => {
      const res = await api.patch(`/subjects/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['studentSubjects'] });
    },
  });
};

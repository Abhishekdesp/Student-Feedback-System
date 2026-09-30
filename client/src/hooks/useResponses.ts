import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { SubmitFeedbackPayload } from '../lib/types';

export const useSubmitResponse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SubmitFeedbackPayload) => {
      const res = await api.post('/responses/submit', payload);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['submissionStatus', variables.subjectId] });
      queryClient.invalidateQueries({ queryKey: ['studentSubjects'] });
    },
  });
};

export const useSubmissionStatus = (subjectId?: string) => {
  return useQuery<boolean>({
    queryKey: ['submissionStatus', subjectId],
    queryFn: async () => {
      if (!subjectId) return false;
      const res = await api.get(`/responses/status/${subjectId}`);
      return res.data.isSubmitted;
    },
    enabled: !!subjectId,
  });
};

export const useClearSubjectData = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (subjectId: string) => {
      const res = await api.delete(`/responses/clear/${subjectId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['subjectSummary'] });
    },
  });
};

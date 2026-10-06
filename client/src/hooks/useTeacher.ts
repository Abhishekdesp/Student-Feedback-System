import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import {
  TeacherDashboardStats,
  TeacherSubjectItem,
  TeacherSubjectAnalytics,
  TeacherAnonymousComment,
  TeacherTrendItem,
} from '../lib/types';

export function useTeacherDashboard() {
  return useQuery<TeacherDashboardStats>({
    queryKey: ['teacher', 'dashboard'],
    queryFn: async () => {
      const res = await api.get('/teacher/dashboard');
      return res.data.stats;
    },
  });
}

export function useTeacherSubjects() {
  return useQuery<TeacherSubjectItem[]>({
    queryKey: ['teacher', 'subjects'],
    queryFn: async () => {
      const res = await api.get('/teacher/subjects');
      return res.data.subjects;
    },
  });
}

export function useTeacherSubjectAnalytics(subjectId?: string) {
  return useQuery<TeacherSubjectAnalytics>({
    queryKey: ['teacher', 'analytics', subjectId],
    queryFn: async () => {
      if (!subjectId) throw new Error('Subject ID is required');
      const res = await api.get(`/teacher/subjects/${subjectId}/analytics`);
      return res.data.analytics;
    },
    enabled: Boolean(subjectId),
  });
}

export function useTeacherSubjectComments(subjectId?: string) {
  return useQuery<TeacherAnonymousComment[]>({
    queryKey: ['teacher', 'comments', subjectId],
    queryFn: async () => {
      if (!subjectId) throw new Error('Subject ID is required');
      const res = await api.get(`/teacher/subjects/${subjectId}/comments`);
      return res.data.comments;
    },
    enabled: Boolean(subjectId),
  });
}

export function useTeacherSubjectTrends(subjectId?: string) {
  return useQuery<TeacherTrendItem[]>({
    queryKey: ['teacher', 'trends', subjectId],
    queryFn: async () => {
      if (!subjectId) throw new Error('Subject ID is required');
      const res = await api.get(`/teacher/subjects/${subjectId}/trends`);
      return res.data.trends;
    },
    enabled: Boolean(subjectId),
  });
}

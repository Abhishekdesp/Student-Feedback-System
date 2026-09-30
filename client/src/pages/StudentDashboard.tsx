import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useStudentSubjects } from '../hooks/useSubjects';
import { SubjectCard } from '../components/SubjectCard';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const year = user?.studentDetails?.academicYear || 'Third';
  const { data: subjects, isLoading, error } = useStudentSubjects(year);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Available Feedback Surveys</h1>
        <p className="text-sm text-slate-500 mt-1">
          Select a subject below to submit your faculty evaluation ({year} Year)
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          Error loading subjects. Please try again.
        </div>
      ) : !subjects || subjects.length === 0 ? (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-lg text-slate-500">
          No subjects currently available for your academic year.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => (
            <SubjectCard key={subject._id} subject={subject} />
          ))}
        </div>
      )}
    </div>
  );
};

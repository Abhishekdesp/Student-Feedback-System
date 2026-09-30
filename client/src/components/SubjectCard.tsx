import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Subject } from '../lib/types';
import { useSubmissionStatus } from '../hooks/useResponses';

interface SubjectCardProps {
  subject: Subject;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject }) => {
  const navigate = useNavigate();
  const { data: isSubmitted, isLoading } = useSubmissionStatus(subject._id);

  const isClosed = subject.status !== 1;

  const handleStartSurvey = () => {
    if (!isSubmitted && !isClosed) {
      navigate(`/survey/${subject._id}`);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded text-xs border border-blue-100">
            {subject.code}
          </span>
          {isLoading ? (
            <span className="text-xs text-gray-400">Loading...</span>
          ) : isSubmitted ? (
            <span className="bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded text-xs border border-green-200">
              Submitted
            </span>
          ) : isClosed ? (
            <span className="bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded text-xs border border-slate-200">
              Closed
            </span>
          ) : (
            <span className="bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded text-xs border border-amber-200">
              Pending
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-1">{subject.facultyName}</h3>
        <p className="text-xs text-slate-500 mb-4">{subject.facultyDesignation}</p>
      </div>

      <div className="mt-4">
        {isSubmitted ? (
          <button
            disabled
            className="w-full py-2 px-4 rounded bg-slate-100 text-slate-400 text-sm font-medium border border-slate-200 cursor-not-allowed"
          >
            Feedback Submitted
          </button>
        ) : isClosed ? (
          <button
            disabled
            className="w-full py-2 px-4 rounded bg-slate-100 text-slate-400 text-sm font-medium border border-slate-200 cursor-not-allowed"
          >
            Feedback Closed
          </button>
        ) : (
          <button
            onClick={handleStartSurvey}
            className="w-full py-2 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition shadow-sm"
          >
            Start Survey &rarr;
          </button>
        )}
      </div>
    </div>
  );
};

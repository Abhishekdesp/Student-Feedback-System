import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuestionsList } from '../hooks/useQuestions';
import { useSubmitResponse, useSubmissionStatus } from '../hooks/useResponses';
import { useSubjectsList } from '../hooks/useSubjects';
import { RatingGrid } from '../components/RatingGrid';
import { ArrowLeft, Send } from 'lucide-react';

export const SurveyForm: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();

  const { data: questions, isLoading: loadingQ } = useQuestionsList();
  const { data: subjects } = useSubjectsList();
  const { data: isSubmitted } = useSubmissionStatus(subjectId);
  const submitMutation = useSubmitResponse();

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const currentSubject = subjects?.find((s) => s._id === subjectId);

  const handleRatingChange = (questionId: string, rating: number) => {
    setRatings((prev) => ({ ...prev, [questionId]: rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!questions || questions.length === 0) return;

    // Validate all questions answered
    const unanswered = questions.filter((q) => !ratings[q._id]);
    if (unanswered.length > 0) {
      setError('Please answer all questions before submitting feedback.');
      return;
    }

    if (!subjectId) return;

    try {
      const formattedRatings = Object.entries(ratings).map(([qId, val]) => ({
        questionId: qId,
        rating: val,
      }));

      await submitMutation.mutateAsync({
        subjectId,
        ratings: formattedRatings,
        userComment: comment,
      });

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error submitting feedback.');
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-slate-200 rounded-xl text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Feedback Already Submitted</h2>
        <p className="text-sm text-slate-500 mb-6">
          You have already completed the evaluation for {currentSubject?.code || 'this subject'}.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center space-x-1 text-sm font-medium text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Dashboard</span>
      </button>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Subject Evaluation
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            {currentSubject ? `${currentSubject.code} — ${currentSubject.facultyName}` : 'Faculty Evaluation Survey'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Please evaluate the lecturer based on the criteria below.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        {loadingQ ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {questions?.map((q, index) => (
              <div key={q._id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="font-semibold text-slate-900 mb-2">
                  {index + 1}. {q.text}
                </p>
                <RatingGrid
                  questionId={q._id}
                  selectedRating={ratings[q._id]}
                  onChange={(val) => handleRatingChange(q._id, val)}
                />
              </div>
            ))}

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <label htmlFor="userComment" className="block font-semibold text-slate-900 mb-1">
                Additional Qualitative Comments (Optional)
              </label>
              <textarea
                id="userComment"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share specific teaching strengths or constructive suggestions for improvement..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
              ></textarea>
              <p className="text-xs text-slate-500 mt-1">
                Comments are processed anonymously for AI sentiment analysis.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition shadow-sm disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{submitMutation.isPending ? 'Submitting...' : 'Submit Feedback'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { useSubjectSummary } from '../hooks/useSubjects';
import { X, Award, AlertCircle, ThumbsUp, MessageSquare, Star, Download } from 'lucide-react';
import { api } from '../lib/axios';

interface FeedbackSummaryModalProps {
  subjectId: string | null;
  onClose: () => void;
}

export const FeedbackSummaryModal: React.FC<FeedbackSummaryModalProps> = ({ subjectId, onClose }) => {
  const { data: summary, isLoading, error } = useSubjectSummary(subjectId || undefined);

  if (!subjectId) return null;

  const handleExport = async () => {
    if (!summary) return;
    try {
      const response = await api.get(`/export/subject/${summary.subject.id}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${summary.subject.code}_Report.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Error exporting spreadsheet report');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <span className="bg-blue-600 text-white text-xs font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
                {summary?.subject.code || 'Loading...'}
              </span>
              <h2 className="text-xl font-bold">{summary?.subject.facultyName}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {summary?.subject.facultyDesignation} • {summary?.subject.academicYear} Year
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {summary && (
              <button
                onClick={handleExport}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Excel</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : error || !summary ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
              Failed to load feedback summary details.
            </div>
          ) : (
            <>
              {/* Metrics Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Average Rating</p>
                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-3xl font-black text-slate-900">{summary.metrics.avgRating}</span>
                      <span className="text-xs text-slate-500">/ 5.0</span>
                    </div>
                  </div>
                  <div className="h-10 w-10 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center">
                    <Star className="h-5 w-5 fill-amber-400" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Total Submissions</p>
                    <span className="text-3xl font-black text-slate-900 mt-1 block">{summary.metrics.totalSubmissions}</span>
                  </div>
                  <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">AI Sentiment Index</p>
                    <span className="text-3xl font-black text-green-600 mt-1 block">{summary.aiSummary.posPct}% Positive</span>
                  </div>
                  <div className="h-10 w-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                    <ThumbsUp className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* AI Sentiment Analysis Breakdown */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <Award className="h-4 w-4 text-purple-600" />
                    <span>Gemini AI Sentiment Breakdown</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {summary.aiSummary.totalComments} Qualitative Feedback Comments
                  </span>
                </div>

                {/* Progress Bar Distribution */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-green-700">Positive Feedback</span>
                      <span className="text-slate-600">{summary.aiSummary.posPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-green-500 h-2.5 rounded-full transition-all" style={{ width: `${summary.aiSummary.posPct}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-700">Neutral Feedback</span>
                      <span className="text-slate-600">{summary.aiSummary.neuPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-slate-400 h-2.5 rounded-full transition-all" style={{ width: `${summary.aiSummary.neuPct}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-amber-700">Constructive / Improvement Notes</span>
                      <span className="text-slate-600">{summary.aiSummary.conPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-amber-500 h-2.5 rounded-full transition-all" style={{ width: `${summary.aiSummary.conPct}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* AI Extracted Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
                  <div className="bg-green-50/60 p-3 rounded-lg border border-green-100">
                    <p className="font-bold text-green-900 mb-1.5 flex items-center space-x-1">
                      <ThumbsUp className="h-3.5 w-3.5 text-green-600" />
                      <span>Key Faculty Strengths</span>
                    </p>
                    <ul className="list-disc list-inside text-green-800 space-y-1">
                      {summary.aiSummary.strengths.map((str, idx) => (
                        <li key={idx}>{str}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-100">
                    <p className="font-bold text-amber-900 mb-1.5 flex items-center space-x-1">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                      <span>Areas for Continuous Improvement</span>
                    </p>
                    <ul className="list-disc list-inside text-amber-800 space-y-1">
                      {summary.aiSummary.growths.map((gro, idx) => (
                        <li key={idx}>{gro}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Individual Student Feedback Comments List */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Submitted Student Qualitative Comments ({summary.aiSummary.comments.length})
                </h3>

                {summary.aiSummary.comments.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No qualitative comments submitted for this subject yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {summary.aiSummary.comments.map((c) => (
                      <div key={c.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                        <p className="text-xs text-slate-700 italic flex-1">"{c.comment}"</p>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${
                            c.sentiment === 'Positive'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : c.sentiment === 'Constructive'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {c.sentiment}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

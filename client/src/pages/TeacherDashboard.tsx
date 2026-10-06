import React, { useState } from 'react';
import {
  useTeacherDashboard,
  useTeacherSubjects,
  useTeacherSubjectAnalytics,
  useTeacherSubjectComments,
  useTeacherSubjectTrends,
} from '../hooks/useTeacher';
import {
  Star,
  Users,
  CheckCircle,
  BookOpen,
  Download,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Award,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../lib/axios';

export const TeacherDashboard: React.FC = () => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useTeacherDashboard();
  const { data: subjects, isLoading: subjectsLoading, error: subjectsError, refetch: refetchSubjects } = useTeacherSubjects();

  // Automatically select first subject when subjects load if none selected
  const activeSubjectId = selectedSubjectId || (subjects && subjects.length > 0 ? subjects[0].id : undefined);

  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useTeacherSubjectAnalytics(activeSubjectId);

  const {
    data: comments,
    isLoading: commentsLoading,
    error: commentsError,
  } = useTeacherSubjectComments(activeSubjectId);

  const {
    data: trends,
    isLoading: trendsLoading,
  } = useTeacherSubjectTrends(activeSubjectId);

  const [downloading, setDownloading] = useState(false);

  const handleDownloadReport = async (subjectId: string, subjectCode: string) => {
    try {
      setDownloading(true);
      const res = await api.get(`/teacher/subjects/${subjectId}/report`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${subjectCode}_Feedback_Report.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download Excel report. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header & Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full uppercase tracking-wider">
                Teacher Portal
              </span>
              {analytics?.subject && (
                <span className="text-xs text-slate-500 font-medium">
                  {analytics.subject.facultyName} ({analytics.subject.facultyEmail})
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">Faculty Evaluation Dashboard</h1>
            <p className="text-slate-600 text-sm mt-1">
              Real-time student feedback analytics, AI-extracted insights, and course metrics.
            </p>
          </div>

          {activeSubjectId && analytics?.subject && (
            <button
              onClick={() => handleDownloadReport(activeSubjectId, analytics.subject.code)}
              disabled={downloading}
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-sm transition disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>{downloading ? 'Generating Report...' : 'Download Excel Report'}</span>
            </button>
          )}
        </div>

        {/* 1. TOP SUMMARY CARDS */}
        {statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-28 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : statsError ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center justify-between">
            <span>Failed to load summary statistics.</span>
            <button onClick={() => refetchStats()} className="flex items-center text-sm font-semibold hover:underline">
              <RefreshCw className="h-4 w-4 mr-1" /> Retry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Rating */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4">
              <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                <Star className="h-6 w-6 fill-amber-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Rating</p>
                <div className="flex items-baseline space-x-1">
                  <span className="text-2xl font-bold text-slate-900">{stats?.overallRating || 0}</span>
                  <span className="text-slate-400 text-sm font-medium">/ 5.0</span>
                </div>
              </div>
            </div>

            {/* Total Responses */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Responses</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.totalResponses || 0}</p>
              </div>
            </div>

            {/* Response Rate */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4">
              <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Response Rate</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.responseRate || 0}%</p>
              </div>
            </div>

            {/* Assigned Subjects */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4">
              <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Subjects</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.assignedSubjectsCount || 0}</p>
              </div>
            </div>

            {/* Active Surveys */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center space-x-4">
              <div className="p-3 bg-violet-100 rounded-xl text-violet-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Surveys</p>
                <p className="text-2xl font-bold text-slate-900">{stats?.activeSurveysCount || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. MY SUBJECTS SELECTOR GRID */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span>My Assigned Subjects</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">Select a subject to inspect analytics</span>
          </div>

          {subjectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-32 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : subjectsError ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl">Failed to load assigned subjects.</div>
          ) : !subjects || subjects.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl text-center border border-slate-200 text-slate-500">
              No subjects currently assigned to your account.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((sub) => {
                const isSelected = sub.id === activeSubjectId;
                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 shadow-sm ${
                      isSelected
                        ? 'bg-blue-60/10 border-blue-600 ring-2 ring-blue-500/20 bg-white'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg uppercase tracking-wide">
                          {sub.code}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-2">{sub.code} Evaluation</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {sub.academicYear} Year • Sem {sub.semester} ({sub.scheme})
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          sub.status === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {sub.status === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <div>
                        <span className="font-semibold text-slate-900">{sub.responseCount}</span> / {sub.totalStudents} Responses
                      </div>
                      <div className="flex items-center space-x-1 font-bold text-slate-900">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span>{sub.averageRating}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DETAILED SUBJECT ANALYTICS SECTION */}
        {activeSubjectId && (
          <div className="space-y-8">
            {analyticsLoading ? (
              <div className="h-96 bg-white rounded-2xl p-8 shadow-sm border border-slate-200 animate-pulse flex items-center justify-center text-slate-400">
                Loading subject feedback analytics...
              </div>
            ) : analyticsError || !analytics ? (
              <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200">
                Unable to load feedback analytics for this subject.
              </div>
            ) : (
              <>
                {/* 3. RATING DISTRIBUTION & OVERVIEW */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Rating Gauge Card */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Overall Subject Score</h3>
                      <div className="mt-4 flex items-baseline space-x-2">
                        <span className="text-5xl font-extrabold text-slate-900">{analytics.overallRating}</span>
                        <span className="text-slate-400 font-semibold text-lg">/ 5.0</span>
                      </div>
                      <div className="flex items-center space-x-1 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= Math.round(analytics.overallRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <p className="text-xs text-slate-500 font-medium">Submissions</p>
                        <p className="text-lg font-bold text-slate-900">{analytics.totalResponses}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl">
                        <p className="text-xs text-slate-500 font-medium">Response Rate</p>
                        <p className="text-lg font-bold text-slate-900">{analytics.responseRate}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Rating Distribution Breakdown */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Rating Star Breakdown</h3>
                    <div className="space-y-3">
                      {analytics.ratingDistribution.map((rd) => (
                        <div key={rd.stars} className="flex items-center space-x-3 text-sm">
                          <div className="w-16 font-semibold text-slate-700 flex items-center space-x-1">
                            <span>{rd.stars}</span>
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          </div>

                          <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-amber-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${rd.percentage}%` }}
                            />
                          </div>

                          <div className="w-20 text-right text-xs font-medium text-slate-500">
                            <span className="font-bold text-slate-900">{rd.count}</span> ({rd.percentage}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. QUESTION-WISE RATINGS & HIGHLIGHTS */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Question-Wise Feedback Analysis</h3>
                      <p className="text-xs text-slate-500">Detailed rating breakdown per evaluation parameter</p>
                    </div>

                    {/* Highlights Badges */}
                    <div className="flex flex-wrap gap-2">
                      {analytics.highestRatedQuestion && (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-full">
                          <Award className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Highest: {analytics.highestRatedQuestion.avgRating}/5</span>
                        </span>
                      )}
                      {analytics.lowestRatedQuestion && (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold rounded-full">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                          <span>Focus Area: {analytics.lowestRatedQuestion.avgRating}/5</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {analytics.questionWise.map((q, idx) => (
                      <div
                        key={q.questionId}
                        className={`p-4 rounded-xl border transition ${
                          q.isHighestRated
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : q.isLowestRated
                            ? 'bg-amber-50/50 border-amber-200'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-start space-x-3">
                            <span className="font-bold text-slate-400 text-sm mt-0.5">#{idx + 1}</span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{q.questionText}</p>
                              {q.isHighestRated && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                  Top Rated Strength
                                </span>
                              )}
                              {q.isLowestRated && (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                  Improvement Opportunity
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <span className="text-lg font-bold text-slate-900">{q.avgRating}</span>
                              <span className="text-xs text-slate-400 font-medium"> / 5.0</span>
                            </div>
                            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                          </div>
                        </div>

                        {/* Progress Bar for Question */}
                        <div className="mt-3 bg-white rounded-full h-2 overflow-hidden border border-slate-200">
                          <div
                            className={`h-full rounded-full ${
                              q.avgRating >= 4.5 ? 'bg-emerald-500' : q.avgRating >= 4.0 ? 'bg-blue-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${(q.avgRating / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6 & 7. AI INSIGHTS & SENTIMENT BREAKDOWN */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* AI Insights Card */}
                  <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="h-4 w-4" />
                      <span>AI-Generated Performance Summary</span>
                    </div>

                    <h3 className="text-xl font-bold mt-2 text-white">Subject Insights & Guidance</h3>
                    <p className="text-xs text-slate-400 mt-1">{analytics.aiInsights.disclaimer}</p>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Strengths */}
                      <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/50 space-y-3">
                        <h4 className="text-sm font-bold text-emerald-400 flex items-center space-x-2">
                          <Award className="h-4 w-4 text-emerald-400" />
                          <span>Key Strengths</span>
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-300">
                          {analytics.aiInsights.strengths.map((str, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <span className="text-emerald-400 font-bold">•</span>
                              <span>{str}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Areas for Improvement */}
                      <div className="bg-slate-800/60 p-5 rounded-xl border border-slate-700/50 space-y-3">
                        <h4 className="text-sm font-bold text-amber-400 flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                          <span>Areas for Improvement</span>
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-300">
                          {analytics.aiInsights.areasForImprovement.map((area, i) => (
                            <li key={i} className="flex items-start space-x-2">
                              <span className="text-amber-400 font-bold">•</span>
                              <span>{area}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Sentiment Summary Card */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Sentiment Breakdown</h3>
                      <div className="mt-6 space-y-4">
                        <div>
                          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                            <span>Positive Feedback</span>
                            <span className="text-emerald-600">{analytics.sentimentDistribution.positivePct}%</span>
                          </div>
                          <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${analytics.sentimentDistribution.positivePct}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                            <span>Neutral Observations</span>
                            <span className="text-slate-600">{analytics.sentimentDistribution.neutralPct}%</span>
                          </div>
                          <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-slate-500 h-full rounded-full"
                              style={{ width: `${analytics.sentimentDistribution.neutralPct}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                            <span>Constructive / Growth</span>
                            <span className="text-amber-600">{analytics.sentimentDistribution.constructivePct}%</span>
                          </div>
                          <div className="bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full"
                              style={{ width: `${analytics.sentimentDistribution.constructivePct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. ANONYMOUS STUDENT COMMENTS SECTION */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                  {/* Privacy Banner */}
                  <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex items-center space-x-3 text-indigo-900 text-xs sm:text-sm font-medium">
                    <ShieldCheck className="h-6 w-6 text-indigo-600 flex-shrink-0" />
                    <span>
                      <strong>Privacy Protected:</strong> Student identities are protected. Feedback comments are strictly anonymized at the database layer.
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                      <span>Anonymous Student Comments ({comments?.length || 0})</span>
                    </h3>
                  </div>

                  {commentsLoading ? (
                    <div className="text-slate-400 text-sm py-4">Loading student comments...</div>
                  ) : commentsError ? (
                    <div className="text-red-600 text-sm py-2">Failed to load student comments.</div>
                  ) : !comments || comments.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 text-sm bg-slate-50 rounded-xl border border-slate-100">
                      No written qualitative comments submitted for this subject yet.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {comments.map((c) => (
                        <div key={c.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className={`px-2.5 py-0.5 font-bold rounded-full text-[11px] ${
                                c.sentiment?.label === 'Positive'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : c.sentiment?.label === 'Constructive'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {c.sentiment?.label || 'Neutral'} ({c.sentiment?.engine || 'Engine'})
                            </span>
                            <span className="text-slate-400">
                              {c.submittedAt ? new Date(c.submittedAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-800 italic">"{c.userComment}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 8. SEMESTER / ACADEMIC YEAR TRENDS */}
                {trends && trends.length > 0 && (
                  <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-indigo-600" />
                      <span>Semester & Academic Year Performance Comparison</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {trends.map((t, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.periodLabel}</p>
                          <div className="flex items-baseline space-x-1">
                            <span className="text-2xl font-bold text-slate-900">{t.avgRating}</span>
                            <span className="text-slate-400 text-xs font-semibold">/ 5.0</span>
                          </div>
                          <div className="text-xs text-slate-500 flex justify-between pt-2 border-t border-slate-200">
                            <span>{t.totalResponses} Responses</span>
                            <span>{t.responseRate}% Rate</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

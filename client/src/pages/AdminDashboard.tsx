import React, { useState } from 'react';
import { useSubjectsList } from '../hooks/useSubjects';
import { useClearSubjectData } from '../hooks/useResponses';
import { api } from '../lib/axios';
import { Download, Trash2, Users, FileText, BarChart2, Eye } from 'lucide-react';
import { FeedbackSummaryModal } from '../components/FeedbackSummaryModal';

export const AdminDashboard: React.FC = () => {
  const { data: subjects, isLoading, error, refetch } = useSubjectsList();
  const clearMutation = useClearSubjectData();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  const handleExport = async (subjectId: string, subjectCode: string) => {
    try {
      const response = await api.get(`/export/subject/${subjectId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${subjectCode}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Error exporting spreadsheet report');
    }
  };

  const handleClearData = async (subjectId: string, subjectCode: string) => {
    if (confirm(`Are you sure you want to clear feedback responses for ${subjectCode}?`)) {
      try {
        await clearMutation.mutateAsync(subjectId);
        alert(`Data cleared for ${subjectCode}`);
        refetch();
      } catch (err) {
        alert('Error clearing data');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Overview of faculty evaluations and survey reports</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
          Error loading dashboard data.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Subjects</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{subjects?.length || 0}</h3>
              </div>
              <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Surveys</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {subjects?.filter((s) => s.status === 1).length || 0}
                </h3>
              </div>
              <div className="h-10 w-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inactive Surveys</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {subjects?.filter((s) => s.status !== 1).length || 0}
                </h3>
              </div>
              <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                <BarChart2 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Faculty Survey Directory</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase border-b border-slate-200">
                    <th className="p-4">Subject Code</th>
                    <th className="p-4">Faculty Name</th>
                    <th className="p-4">Designation</th>
                    <th className="p-4">Year / Sem</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {subjects?.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50">
                      <td className="p-4 font-bold text-blue-600">{s.code}</td>
                      <td className="p-4 font-medium text-slate-900">{s.facultyName}</td>
                      <td className="p-4 text-slate-600">{s.facultyDesignation}</td>
                      <td className="p-4 text-slate-600">
                        {s.academicYear} Year (Sem {s.semester})
                      </td>
                      <td className="p-4">
                        {s.status === 1 ? (
                          <span className="bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5 rounded border border-green-200">
                            Active
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded border border-slate-200">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedSubjectId(s._id)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded text-xs font-medium border border-purple-200 transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>AI Report</span>
                        </button>
                        <button
                          onClick={() => handleExport(s._id, s.code)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-medium border border-blue-200 transition"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Export Excel</span>
                        </button>
                        <button
                          onClick={() => handleClearData(s._id, s.code)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-medium border border-red-200 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Clear Data</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Render AI Feedback Summary Modal */}
      {selectedSubjectId && (
        <FeedbackSummaryModal
          subjectId={selectedSubjectId}
          onClose={() => setSelectedSubjectId(null)}
        />
      )}
    </div>
  );
};

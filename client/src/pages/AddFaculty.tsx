import React, { useState } from 'react';
import { useSubjectsList, useCreateSubject, useToggleSubjectStatus } from '../hooks/useSubjects';
import { Plus, Users, ToggleLeft, ToggleRight, Eye, Download } from 'lucide-react';
import { FeedbackSummaryModal } from '../components/FeedbackSummaryModal';
import { api } from '../lib/axios';

export const AddFaculty: React.FC = () => {
  const { data: subjects, isLoading, refetch } = useSubjectsList();
  const createMutation = useCreateSubject();
  const toggleMutation = useToggleSubjectStatus();

  const [activeTab, setActiveTab] = useState<'add' | 'directory'>('add');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [facultyName, setFacultyName] = useState('');
  const [facultyDesignation, setFacultyDesignation] = useState('');
  const [facultyEmail, setFacultyEmail] = useState('');
  const [facultyMobile, setFacultyMobile] = useState('');
  const [scheme, setScheme] = useState('K-Scheme');
  const [semester, setSemester] = useState('5');
  const [academicYear, setAcademicYear] = useState<'First' | 'Second' | 'Third'>('Third');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      await createMutation.mutateAsync({
        code,
        facultyName,
        facultyDesignation,
        facultyEmail,
        facultyMobile,
        scheme,
        semester,
        academicYear,
      });

      setMessage({ type: 'success', text: `Faculty member (${code}) registered successfully!` });
      setCode('');
      setFacultyName('');
      setFacultyDesignation('');
      setFacultyEmail('');
      setFacultyMobile('');
      refetch();
      setActiveTab('directory');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Error registering faculty' });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      await toggleMutation.mutateAsync({ id, status: newStatus });
      refetch();
    } catch (err) {
      alert('Error updating status');
    }
  };

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Faculty Management</h1>
            <p className="text-sm text-slate-500 mt-1">Register faculty members and manage survey status</p>
          </div>

          <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('add')}
              className={`flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold rounded-md transition ${activeTab === 'add' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Plus className="h-4 w-4" />
              <span>Add Faculty</span>
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold rounded-md transition ${activeTab === 'directory' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Users className="h-4 w-4" />
              <span>Directory ({subjects?.length || 0})</span>
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg text-sm border ${message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
              }`}
          >
            {message.text}
          </div>
        )}

        {activeTab === 'add' ? (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Faculty Name</label>
              <input
                type="text"
                required
                value={facultyName}
                onChange={(e) => setFacultyName(e.target.value)}
                placeholder="e.g. Dr. Rajesh Sharma"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
              <input
                type="text"
                required
                value={facultyDesignation}
                onChange={(e) => setFacultyDesignation(e.target.value)}
                placeholder="e.g. Professor & HOD"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. AJP, WT, DBMS"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={facultyEmail}
                onChange={(e) => setFacultyEmail(e.target.value)}
                placeholder="faculty@college.edu"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
              <input
                type="text"
                required
                value={facultyMobile}
                onChange={(e) => setFacultyMobile(e.target.value)}
                placeholder="10-digit mobile"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Scheme</label>
              <input
                type="text"
                required
                value={scheme}
                onChange={(e) => setScheme(e.target.value)}
                placeholder="e.g. K-Scheme"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
              <select
                value={semester}
                onChange={(e) => {
                  setSemester(e.target.value);
                  const sem = e.target.value;
                  if (sem === '1' || sem === '2') setAcademicYear('First');
                  else if (sem === '3' || sem === '4') setAcademicYear('Second');
                  else if (sem === '5' || sem === '6') setAcademicYear('Third');
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
              >
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Academic Year</label>
              <input
                type="text"
                readOnly
                value={academicYear}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-700 text-sm"
              />
            </div>

            <div className="md:col-span-2 mt-4">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition shadow-sm disabled:opacity-50"
              >
                {createMutation.isPending ? 'Registering...' : 'Register Faculty'}
              </button>
            </div>
          </form>
        ) : (
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase border-b border-slate-200">
                    <th className="p-4">Subject</th>
                    <th className="p-4">Faculty Name</th>
                    <th className="p-4">Designation</th>
                    <th className="p-4">Email / Mobile</th>
                    <th className="p-4">Year / Sem</th>
                    <th className="p-4">Survey Status</th>
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
                        {s.facultyEmail} <br />
                        <span className="text-xs text-slate-400">{s.facultyMobile}</span>
                      </td>
                      <td className="p-4 text-slate-600">
                        {s.academicYear} Year (Sem {s.semester})
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleStatus(s._id, s.status)}
                          className="flex items-center space-x-1.5 focus:outline-none"
                        >
                          {s.status === 1 ? (
                            <>
                              <ToggleRight className="h-6 w-6 text-green-600" />
                              <span className="text-xs font-semibold text-green-700">ON</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-6 w-6 text-slate-400" />
                              <span className="text-xs font-semibold text-slate-500">OFF</span>
                            </>
                          )}
                        </button>
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* AI Feedback Summary Modal */}
        {selectedSubjectId && (
          <FeedbackSummaryModal
            subjectId={selectedSubjectId}
            onClose={() => setSelectedSubjectId(null)}
          />
        )}
      </div>
    </div>
  );
};

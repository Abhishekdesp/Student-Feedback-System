import React, { useState } from 'react';
import {
  useSubjectsList,
  useCreateSubject,
  useToggleSubjectStatus,
  useFacultyList,
  useCreateFaculty,
  useDeleteFaculty,
  useDeleteSubject,
} from '../hooks/useSubjects';
import {
  Plus,
  Users,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  Download,
  BookOpen,
  Trash2,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Mail,
  Phone,
  Layers,
} from 'lucide-react';
import { FeedbackSummaryModal } from '../components/FeedbackSummaryModal';
import { api } from '../lib/axios';

export const AddFaculty: React.FC = () => {
  // Main Navigation Sections: 'faculty' (Manage Teachers) vs 'subjects' (Assign Subjects)
  const [mainSection, setMainSection] = useState<'faculty' | 'subjects'>('faculty');

  // Sub-tabs
  const [facultyTab, setFacultyTab] = useState<'add' | 'directory'>('add');
  const [subjectTab, setSubjectTab] = useState<'assign' | 'directory'>('assign');

  // Queries & Mutations
  const { data: facultyList, isLoading: loadingFaculty, refetch: refetchFaculty } = useFacultyList();
  const { data: subjects, isLoading: loadingSubjects, refetch: refetchSubjects } = useSubjectsList();
  const createFacultyMutation = useCreateFaculty();
  const deleteFacultyMutation = useDeleteFaculty();
  const createSubjectMutation = useCreateSubject();
  const deleteSubjectMutation = useDeleteSubject();
  const toggleSubjectMutation = useToggleSubjectStatus();

  // Feedback Summary Modal State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Notifications
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State: Add Faculty (Teacher Account)
  const [facultyName, setFacultyName] = useState('');
  const [facultyUsername, setFacultyUsername] = useState('');
  const [facultyEmail, setFacultyEmail] = useState('');
  const [facultyPassword, setFacultyPassword] = useState('teacher123');
  const [showPassword, setShowPassword] = useState(false);
  const [facultyDesignation, setFacultyDesignation] = useState('Assistant Professor');
  const [facultyMobile, setFacultyMobile] = useState('');
  const [facultyDepartment, setFacultyDepartment] = useState('Computer Engineering');

  // Form State: Assign Subject to Faculty
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [subjectCode, setSubjectCode] = useState('');
  const [scheme, setScheme] = useState('K-Scheme');
  const [semester, setSemester] = useState('5');
  const [academicYear, setAcademicYear] = useState<'First' | 'Second' | 'Third'>('Third');
  const [subjectStatus, setSubjectStatus] = useState<number>(1);

  // Handler: Register Faculty Member (No subjects required)
  const handleRegisterFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!facultyName.trim() || !facultyUsername.trim() || !facultyPassword.trim()) {
      setMessage({ type: 'error', text: 'Full Name, Username, and Password are required.' });
      return;
    }

    try {
      await createFacultyMutation.mutateAsync({
        name: facultyName.trim(),
        username: facultyUsername.trim().toLowerCase(),
        email: facultyEmail.trim() || undefined,
        password: facultyPassword,
        designation: facultyDesignation.trim(),
        mobile: facultyMobile.trim() || undefined,
        department: facultyDepartment.trim(),
      });

      setMessage({
        type: 'success',
        text: `Faculty member "${facultyName}" created successfully! You can now assign subjects to them.`,
      });

      // Clear faculty form
      setFacultyName('');
      setFacultyUsername('');
      setFacultyEmail('');
      setFacultyPassword('teacher123');
      setFacultyMobile('');
      refetchFaculty();
      setFacultyTab('directory');
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error creating faculty account.',
      });
    }
  };

  // Handler: Delete Faculty
  const handleDeleteFaculty = async (teacherId: string, teacherName: string) => {
    if (!window.confirm(`Are you sure you want to delete faculty member "${teacherName}"? Any assigned subjects will be unlinked.`)) {
      return;
    }

    try {
      await deleteFacultyMutation.mutateAsync(teacherId);
      setMessage({ type: 'success', text: `Faculty member "${teacherName}" deleted successfully.` });
      refetchFaculty();
      refetchSubjects();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error deleting faculty member.',
      });
    }
  };

  // Quick action: Switch to assign subject for a specific faculty
  const handleQuickAssignSubject = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setMainSection('subjects');
    setSubjectTab('assign');
    setMessage(null);
  };

  // Handler: Assign Subject to Faculty
  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedTeacherId) {
      setMessage({ type: 'error', text: 'Please select a registered faculty member from the dropdown.' });
      return;
    }

    if (!subjectCode.trim()) {
      setMessage({ type: 'error', text: 'Subject Code is required.' });
      return;
    }

    const teacher = facultyList?.find((f) => f.id === selectedTeacherId || f._id === selectedTeacherId);

    try {
      await createSubjectMutation.mutateAsync({
        code: subjectCode.trim().toUpperCase(),
        teacherId: selectedTeacherId,
        facultyName: teacher?.name || 'Faculty',
        facultyEmail: teacher?.email || '',
        facultyDesignation: teacher?.designation || 'Professor',
        facultyMobile: teacher?.mobile || '',
        scheme,
        semester,
        academicYear,
        status: subjectStatus,
      });

      setMessage({
        type: 'success',
        text: `Subject "${subjectCode.toUpperCase()}" successfully assigned to ${teacher?.name || 'faculty'}!`,
      });

      setSubjectCode('');
      refetchSubjects();
      refetchFaculty();
      setSubjectTab('directory');
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error assigning subject.',
      });
    }
  };

  // Handler: Toggle Survey Status
  const handleToggleStatus = async (id: string, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      await toggleSubjectMutation.mutateAsync({ id, status: newStatus });
      refetchSubjects();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  // Handler: Export Excel Report
  const handleExport = async (subjectId: string, subjectCode: string) => {
    try {
      const response = await api.get(`/export/subject/${subjectId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${subjectCode}_Feedback_Report.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Error exporting spreadsheet report');
    }
  };

  // Handler: Delete Subject
  const handleDeleteSubject = async (subjectId: string, subjectCode: string) => {
    if (!window.confirm(`Are you sure you want to delete subject "${subjectCode}"? This will remove all feedback records associated with it.`)) {
      return;
    }
    try {
      await deleteSubjectMutation.mutateAsync(subjectId);
      setMessage({ type: 'success', text: `Subject "${subjectCode}" deleted successfully.` });
      refetchSubjects();
      refetchFaculty();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Error deleting subject.',
      });
    }
  };

  const selectedTeacher = facultyList?.find((f) => f.id === selectedTeacherId || f._id === selectedTeacherId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Faculty & Subject Management</h1>
        <p className="text-slate-600 mt-1">
          Manage teacher accounts independently, then assign academic subjects to registered faculty members.
        </p>
      </div>

      {/* Main Section Navigation Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => {
            setMainSection('faculty');
            setMessage(null);
          }}
          className={`flex items-center justify-between p-5 rounded-2xl border-2 transition text-left cursor-pointer ${
            mainSection === 'faculty'
              ? 'border-blue-600 bg-blue-50/60 shadow-md ring-2 ring-blue-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div
              className={`p-3 rounded-xl ${
                mainSection === 'faculty' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-slate-900">1. Faculty Members</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
                  {facultyList?.length || 0} Registered
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Add faculty accounts & credentials without assigning subjects
              </p>
            </div>
          </div>
          <ArrowRight
            className={`h-5 w-5 transition ${
              mainSection === 'faculty' ? 'text-blue-600 translate-x-1' : 'text-slate-400'
            }`}
          />
        </button>

        <button
          onClick={() => {
            setMainSection('subjects');
            setMessage(null);
          }}
          className={`flex items-center justify-between p-5 rounded-2xl border-2 transition text-left cursor-pointer ${
            mainSection === 'subjects'
              ? 'border-indigo-600 bg-indigo-50/60 shadow-md ring-2 ring-indigo-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div
              className={`p-3 rounded-xl ${
                mainSection === 'subjects' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-slate-900">2. Assign Subjects</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold">
                  {subjects?.length || 0} Assigned
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Link subjects to existing registered teachers & manage surveys
              </p>
            </div>
          </div>
          <ArrowRight
            className={`h-5 w-5 transition ${
              mainSection === 'subjects' ? 'text-indigo-600 translate-x-1' : 'text-slate-400'
            }`}
          />
        </button>
      </div>

      {/* Global Alerts */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-xl border flex items-start space-x-3 transition ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-sm font-medium">{message.text}</div>
          <button
            onClick={() => setMessage(null)}
            className="text-xs opacity-60 hover:opacity-100 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 1: FACULTY MEMBERS MANAGEMENT                         */}
      {/* ============================================================== */}
      {mainSection === 'faculty' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Subtabs Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Faculty Members Management</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Register teachers into the database with their login credentials and contact details.
              </p>
            </div>

            <div className="flex bg-slate-200/70 p-1 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setFacultyTab('add')}
                className={`flex items-center space-x-1.5 px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition ${
                  facultyTab === 'add'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="h-4 w-4" />
                <span>Add Faculty Member</span>
              </button>
              <button
                onClick={() => setFacultyTab('directory')}
                className={`flex items-center space-x-1.5 px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition ${
                  facultyTab === 'directory'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Faculty Directory ({facultyList?.length || 0})</span>
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Sub-tab 1: Add Faculty Form */}
            {facultyTab === 'add' && (
              <div>
                <div className="mb-6 bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs sm:text-sm text-blue-800 flex items-start space-x-2.5">
                  <Briefcase className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Independent Faculty Registration:</span> You can add teachers
                    here first with their login username and credentials. After adding a teacher, use{' '}
                    <strong className="underline cursor-pointer" onClick={() => setMainSection('subjects')}>
                      Section 2 (Assign Subjects)
                    </strong>{' '}
                    to assign them courses.
                  </div>
                </div>

                <form onSubmit={handleRegisterFaculty} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={facultyName}
                        onChange={(e) => setFacultyName(e.target.value)}
                        placeholder="e.g. Abhishek Deshpande"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                      />
                    </div>

                    {/* Username */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Teacher Login Username *
                      </label>
                      <input
                        type="text"
                        required
                        value={facultyUsername}
                        onChange={(e) => setFacultyUsername(e.target.value.toLowerCase().trim())}
                        placeholder="e.g. abhishek or abhishek.deshpande"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Teacher will use this username to log in to the Teacher Portal.
                      </p>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Official Email
                      </label>
                      <div className="relative">
                        <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="email"
                          value={facultyEmail}
                          onChange={(e) => setFacultyEmail(e.target.value)}
                          placeholder="e.g. abhishek.deshpande@college.edu"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                        />
                      </div>
                    </div>

                    {/* Password with Eye Toggle */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Initial Login Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={facultyPassword}
                          onChange={(e) => setFacultyPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full pr-12 pl-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-700 transition"
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Default is "teacher123". You can customize it.</p>
                    </div>

                    {/* Designation */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Designation *
                      </label>
                      <select
                        value={facultyDesignation}
                        onChange={(e) => setFacultyDesignation(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-white"
                      >
                        <option value="Professor & HOD">Professor & HOD</option>
                        <option value="Professor">Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Senior Lecturer">Senior Lecturer</option>
                        <option value="Lecturer">Lecturer</option>
                        <option value="Visiting Faculty">Visiting Faculty</option>
                      </select>
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Department
                      </label>
                      <select
                        value={facultyDepartment}
                        onChange={(e) => setFacultyDepartment(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-white"
                      >
                        <option value="Computer Engineering">Computer Engineering</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="AI & Data Science">AI & Data Science</option>
                        <option value="Electronics & Telecommunication">Electronics & Telecommunication</option>
                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                        <option value="Civil Engineering">Civil Engineering</option>
                        <option value="Applied Sciences">Applied Sciences</option>
                      </select>
                    </div>

                    {/* Mobile */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Mobile Number
                      </label>
                      <div className="relative">
                        <Phone className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="tel"
                          value={facultyMobile}
                          onChange={(e) => setFacultyMobile(e.target.value)}
                          placeholder="e.g. 9876543210"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
                    <button
                      type="submit"
                      disabled={createFacultyMutation.isPending}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl shadow-sm transition flex items-center space-x-2 text-sm cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{createFacultyMutation.isPending ? 'Registering...' : 'Register Faculty Account'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Sub-tab 2: Faculty Directory */}
            {facultyTab === 'directory' && (
              <div>
                {loadingFaculty ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : !facultyList || facultyList.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-slate-700">No faculty members found</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Get started by registering faculty members without assigning any subjects upfront.
                    </p>
                    <button
                      onClick={() => setFacultyTab('add')}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition"
                    >
                      Add First Faculty
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                          <th className="py-3 px-4">Faculty Member</th>
                          <th className="py-3 px-4">Login Username</th>
                          <th className="py-3 px-4">Designation & Dept</th>
                          <th className="py-3 px-4">Contact</th>
                          <th className="py-3 px-4">Assigned Subjects</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {facultyList.map((faculty) => (
                          <tr key={faculty.id || faculty._id} className="hover:bg-slate-50/70 transition">
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                                  {faculty.name ? faculty.name.charAt(0).toUpperCase() : 'T'}
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-900 block">{faculty.name}</span>
                                  <span className="text-xs text-slate-400 capitalize">{faculty.role}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <span className="font-mono text-xs bg-slate-100 px-2.5 py-1 rounded-md text-slate-700 border border-slate-200">
                                {faculty.username}
                              </span>
                            </td>

                            <td className="py-4 px-4">
                              <span className="font-medium text-slate-800 block text-xs">{faculty.designation}</span>
                              <span className="text-xs text-slate-500">{faculty.department || 'General'}</span>
                            </td>

                            <td className="py-4 px-4 text-xs text-slate-600">
                              <div>{faculty.email || <span className="text-slate-400 italic">No email</span>}</div>
                              <div className="text-slate-400 mt-0.5">{faculty.mobile || '—'}</div>
                            </td>

                            <td className="py-4 px-4">
                              {faculty.assignedSubjects && faculty.assignedSubjects.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {faculty.assignedSubjects.map((sub) => (
                                    <span
                                      key={sub._id}
                                      className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200"
                                    >
                                      {sub.code} ({sub.academicYear})
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-medium">
                                  No subjects assigned
                                </span>
                              )}
                            </td>

                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => handleQuickAssignSubject(faculty.id || faculty._id)}
                                  className="inline-flex items-center space-x-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition cursor-pointer"
                                  title="Assign a subject to this faculty"
                                >
                                  <BookOpen className="h-3.5 w-3.5" />
                                  <span>Assign Subject</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteFaculty(faculty.id || faculty._id, faculty.name)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                  title="Delete faculty account"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 2: ASSIGN SUBJECTS TO FACULTY                         */}
      {/* ============================================================== */}
      {mainSection === 'subjects' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Subtabs Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                <span>Subject & Course Assignments</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign curriculum subjects to registered teachers and manage student feedback surveys.
              </p>
            </div>

            <div className="flex bg-slate-200/70 p-1 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setSubjectTab('assign')}
                className={`flex items-center space-x-1.5 px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition ${
                  subjectTab === 'assign'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="h-4 w-4" />
                <span>Assign Subject</span>
              </button>
              <button
                onClick={() => setSubjectTab('directory')}
                className={`flex items-center space-x-1.5 px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition ${
                  subjectTab === 'directory'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>Assigned Subjects ({subjects?.length || 0})</span>
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* Sub-tab 1: Assign Subject Form */}
            {subjectTab === 'assign' && (
              <div>
                {!facultyList || facultyList.length === 0 ? (
                  <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <AlertCircle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                    <h3 className="text-base font-bold text-amber-900">No Registered Faculty Members</h3>
                    <p className="text-sm text-amber-700 mt-1 max-w-md mx-auto">
                      You must add a faculty member before assigning subjects. Only registered teachers can be
                      assigned to courses.
                    </p>
                    <button
                      onClick={() => {
                        setMainSection('faculty');
                        setFacultyTab('add');
                      }}
                      className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition"
                    >
                      Go to "Add Faculty Member"
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleAssignSubject} className="space-y-6">
                    {/* Faculty Selection Dropdown */}
                    <div className="p-5 bg-indigo-50/60 border border-indigo-200 rounded-2xl">
                      <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">
                        Select Registered Faculty Member *
                      </label>
                      <select
                        required
                        value={selectedTeacherId}
                        onChange={(e) => setSelectedTeacherId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-800 text-sm"
                      >
                        <option value="">-- Choose a teacher from the registered faculty list --</option>
                        {facultyList.map((f) => (
                          <option key={f.id || f._id} value={f.id || f._id}>
                            {f.name} — @{f.username} ({f.designation || 'Faculty'})
                          </option>
                        ))}
                      </select>

                      {/* Selected Teacher Preview Card */}
                      {selectedTeacher && (
                        <div className="mt-4 p-4 bg-white border border-indigo-200/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                              {selectedTeacher.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 text-sm block">{selectedTeacher.name}</span>
                              <span className="text-slate-500">
                                {selectedTeacher.designation} • {selectedTeacher.department || 'General'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 text-slate-600">
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Email</span>
                              <span>{selectedTeacher.email || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">Mobile</span>
                              <span>{selectedTeacher.mobile || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px] uppercase font-bold">
                                Current Subjects
                              </span>
                              <span className="font-bold text-indigo-600">{selectedTeacher.assignedCount || 0}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Subject Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Subject Code */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Subject Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={subjectCode}
                          onChange={(e) => setSubjectCode(e.target.value)}
                          placeholder="e.g. ML, WT, DBMS"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono font-bold text-sm"
                        />
                      </div>

                      {/* Scheme */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Scheme *
                        </label>
                        <select
                          value={scheme}
                          onChange={(e) => setScheme(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium bg-white"
                        >
                          <option value="K-Scheme">K-Scheme</option>
                          <option value="I-Scheme">I-Scheme</option>
                          <option value="G-Scheme">G-Scheme</option>
                        </select>
                      </div>

                      {/* Semester */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Semester *
                        </label>
                        <select
                          value={semester}
                          onChange={(e) => setSemester(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium bg-white"
                        >
                          <option value="1">Semester 1</option>
                          <option value="2">Semester 2</option>
                          <option value="3">Semester 3</option>
                          <option value="4">Semester 4</option>
                          <option value="5">Semester 5</option>
                          <option value="6">Semester 6</option>
                        </select>
                      </div>

                      {/* Academic Year */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Academic Year *
                        </label>
                        <select
                          value={academicYear}
                          onChange={(e) => setAcademicYear(e.target.value as any)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium bg-white"
                        >
                          <option value="First">First Year</option>
                          <option value="Second">Second Year</option>
                          <option value="Third">Third Year</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <label className="text-xs font-semibold text-slate-600">Survey Initial Status:</label>
                        <select
                          value={subjectStatus}
                          onChange={(e) => setSubjectStatus(Number(e.target.value))}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value={1}>Active (Open for student feedback)</option>
                          <option value={0}>Inactive (Closed)</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={createSubjectMutation.isPending}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold rounded-xl shadow-sm transition flex items-center space-x-2 text-sm cursor-pointer"
                      >
                        <BookOpen className="h-4 w-4" />
                        <span>{createSubjectMutation.isPending ? 'Assigning...' : 'Assign Subject to Faculty'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Sub-tab 2: Assigned Subjects Directory */}
            {subjectTab === 'directory' && (
              <div>
                {loadingSubjects ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : !subjects || subjects.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                    <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-slate-700">No subjects assigned yet</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Assign subjects to registered faculty members to start gathering student survey feedback.
                    </p>
                    <button
                      onClick={() => setSubjectTab('assign')}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
                    >
                      Assign First Subject
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50">
                          <th className="py-3 px-4">Subject</th>
                          <th className="py-3 px-4">Assigned Faculty</th>
                          <th className="py-3 px-4">Curriculum Info</th>
                          <th className="py-3 px-4">Survey Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {subjects.map((sub) => (
                          <tr key={sub._id} className="hover:bg-slate-50/70 transition">
                            <td className="py-4 px-4">
                              <span className="font-bold text-slate-900 block font-mono text-base">{sub.code}</span>
                              <span className="text-xs text-slate-500">
                                {sub.academicYear} Year • Sem {sub.semester}
                              </span>
                            </td>

                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-2.5">
                                <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                                  {sub.facultyName ? sub.facultyName.charAt(0) : 'F'}
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-900 block text-xs">{sub.facultyName}</span>
                                  <span className="text-[11px] text-slate-500">{sub.facultyDesignation}</span>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4 text-xs text-slate-600">
                              <div className="font-medium text-slate-800">{sub.scheme}</div>
                              <div className="text-slate-400">
                                {sub.facultyEmail || <span className="italic">No email</span>}
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <button
                                onClick={() => handleToggleStatus(sub._id, sub.status)}
                                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                                  sub.status === 1
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                {sub.status === 1 ? (
                                  <>
                                    <ToggleRight className="h-4 w-4 text-emerald-600" />
                                    <span>Survey Active</span>
                                  </>
                                ) : (
                                  <>
                                    <ToggleLeft className="h-4 w-4 text-slate-400" />
                                    <span>Survey Inactive</span>
                                  </>
                                )}
                              </button>
                            </td>

                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  onClick={() => setSelectedSubjectId(sub._id)}
                                  className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition cursor-pointer"
                                  title="View AI Sentiment & Metrics Summary"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Analytics</span>
                                </button>
                                <button
                                  onClick={() => handleExport(sub._id, sub.code)}
                                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                  title="Download Excel Report"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSubject(sub._id, sub.code)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                  title="Delete subject"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI & Metric Summary Modal */}
      {selectedSubjectId && (
        <FeedbackSummaryModal
          subjectId={selectedSubjectId}
          onClose={() => setSelectedSubjectId(null)}
        />
      )}
    </div>
  );
};

export default AddFaculty;

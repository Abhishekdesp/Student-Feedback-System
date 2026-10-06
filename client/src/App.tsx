import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Login } from './pages/Login';
import { StudentDashboard } from './pages/StudentDashboard';
import { SurveyForm } from './pages/SurveyForm';
import { AdminDashboard } from './pages/AdminDashboard';
import { AddFaculty } from './pages/AddFaculty';
import { Questions } from './pages/Questions';
import { Settings } from './pages/Settings';
import { TeacherDashboard } from './pages/TeacherDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RootRedirect: React.FC = () => {
  const { user, loading } = useAuthContext();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'student') return <Navigate to="/dashboard" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
  return <Navigate to="/admin" replace />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RootRedirect />} />

            {/* Student Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/survey/:subjectId" element={<SurveyForm />} />
            </Route>

            {/* Teacher Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['teacher', 'admin']} />}>
              <Route path="/teacher" element={<TeacherDashboard />} />
            </Route>

            {/* Admin / Teacher Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/faculty" element={<AddFaculty />} />
              <Route path="/admin/questions" element={<Questions />} />
              <Route path="/admin/settings" element={<Settings />} />
            </Route>

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

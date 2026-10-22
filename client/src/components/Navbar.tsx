import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GraduationCap, LogOut, Settings, Users, HelpCircle, LayoutDashboard } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  const isAdminOrTeacher = user.role === 'admin' || user.role === 'teacher';

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    if (path === '/teacher') return location.pathname === '/teacher';
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const getNavLinkClass = (path: string) => {
    const active = isActive(path);
    return `flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
      active
        ? 'bg-blue-600 text-white shadow-xs font-semibold'
        : 'text-slate-300 hover:text-white hover:bg-slate-800'
    }`;
  };

  return (
    <nav className="bg-slate-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-8 w-8 text-blue-400" />
            <Link to={isAdminOrTeacher ? '/admin' : '/dashboard'} className="font-bold text-lg tracking-wide hover:text-blue-300">
              Student Feedback Portal
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            {user.role === 'teacher' ? (
              <Link to="/teacher" className={getNavLinkClass('/teacher')}>
                <LayoutDashboard className="h-4 w-4" />
                <span>My Teacher Portal</span>
              </Link>
            ) : user.role === 'admin' ? (
              <>
                <Link to="/admin" className={getNavLinkClass('/admin')}>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Admin Dashboard</span>
                </Link>
                <Link to="/teacher" className={getNavLinkClass('/teacher')}>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Teacher Portal</span>
                </Link>
                <Link to="/admin/faculty" className={getNavLinkClass('/admin/faculty')}>
                  <Users className="h-4 w-4" />
                  <span>Faculty & Subjects</span>
                </Link>
                <Link to="/admin/questions" className={getNavLinkClass('/admin/questions')}>
                  <HelpCircle className="h-4 w-4" />
                  <span>Questions</span>
                </Link>
                <Link to="/admin/settings" className={getNavLinkClass('/admin/settings')}>
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </>
            ) : (
              <Link to="/dashboard" className={getNavLinkClass('/dashboard')}>
                <LayoutDashboard className="h-4 w-4" />
                <span>My Surveys</span>
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right text-xs sm:text-sm">
              <span className="block font-medium text-slate-200">{user.username}</span>
              <span className="text-slate-400 capitalize">
                {user.role} {user.role === 'student' && user.studentDetails?.academicYear ? `(${user.studentDetails.academicYear} Year)` : ''}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-1.5 border border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-800 text-slate-300 hover:text-white transition"
            >
              <LogOut className="h-4 w-4 text-red-400" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};


import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GraduationCap, LogOut, Settings, Users, HelpCircle, LayoutDashboard } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  const isAdminOrTeacher = user.role === 'admin' || user.role === 'teacher';

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

          <div className="hidden md:flex items-center space-x-4">
            {isAdminOrTeacher ? (
              <>
                <Link to="/admin" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800">
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
                <Link to="/admin/faculty" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800">
                  <Users className="h-4 w-4" />
                  <span>Faculty Directory</span>
                </Link>
                <Link to="/admin/questions" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800">
                  <HelpCircle className="h-4 w-4" />
                  <span>Questions</span>
                </Link>
                <Link to="/admin/settings" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-blue-400 hover:bg-slate-800">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </>
            ) : (
              <Link to="/dashboard" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800">
                <LayoutDashboard className="h-4 w-4" />
                <span>My Surveys</span>
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right text-xs sm:text-sm">
              <span className="block font-medium text-slate-200">{user.username}</span>
              <span className="text-slate-400 capitalize">{user.role} {user.studentDetails ? `(${user.studentDetails.academicYear} Year)` : ''}</span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-1.5 border border-slate-700 rounded-md text-sm font-medium hover:bg-slate-800 transition"
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

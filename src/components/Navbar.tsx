
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { User, Settings, LogOut, Home, BookOpen, Users, FileText, HelpCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-gray-900">Coding Platform</span>
            </div>
            <div className="ml-6 flex space-x-8">
              {user.role === 'admin' ? (
                <>
                  <Link
                    to="/admin/dashboard"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isActive('/admin/dashboard')
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/users"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isActive('/admin/users')
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Users
                  </Link>
                  <Link
                    to="/admin/modules"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isActive('/admin/modules')
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Modules
                  </Link>
                  <Link
                    to="/admin/problems"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isActive('/admin/problems')
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Problems
                  </Link>
                  <Link
                    to="/admin/mcqs"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isActive('/admin/mcqs')
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    MCQs
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/student/dashboard"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isActive('/student/dashboard')
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                  <Link
                    to="/student/mcqs"
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                      isActive('/student/mcqs')
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    MCQ Practice
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium text-gray-700">{user.full_name}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  user.role === 'admin' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.role}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

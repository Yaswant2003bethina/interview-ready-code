
import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  BookOpen, 
  User, 
  LogOut, 
  Users, 
  Settings, 
  PuzzlePiece,
  HelpCircle,
  GraduationCap
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()

  if (!user) return null

  const isAdmin = user.role === 'admin'
  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
                <span className="text-xl font-bold text-gray-900">CodeLab</span>
              </div>
              
              <div className="hidden md:ml-8 md:flex md:space-x-1">
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 inline mr-2" />
                  Dashboard
                </Link>
                
                <Link
                  to="/mcqs"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/mcqs') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <HelpCircle className="w-4 h-4 inline mr-2" />
                  MCQ Practice
                </Link>

                {isAdmin && (
                  <>
                    <Link
                      to="/admin/users"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/admin/users') 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Users className="w-4 h-4 inline mr-2" />
                      Users
                    </Link>
                    
                    <Link
                      to="/admin/modules"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/admin/modules') 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 inline mr-2" />
                      Modules
                    </Link>
                    
                    <Link
                      to="/admin/problems"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/admin/problems') 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <PuzzlePiece className="w-4 h-4 inline mr-2" />
                      Problems
                    </Link>
                    
                    <Link
                      to="/admin/mcqs"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        isActive('/admin/mcqs') 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <HelpCircle className="w-4 h-4 inline mr-2" />
                      Manage MCQs
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.full_name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                      <p className="text-xs text-blue-600 font-medium">
                        {user.role.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}

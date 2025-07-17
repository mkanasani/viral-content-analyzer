import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, History, Activity } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Navigation */}
      <nav className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Activity className="h-8 w-8 text-red-500" />
                <span className="text-xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                  Viral Content Identifier
                </span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive('/') 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <Search className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              
              <Link
                to="/history"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  isActive('/history') 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <History className="h-4 w-4" />
                <span>History</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Clock, TrendingUp } from 'lucide-react';
import SearchForm from '../components/SearchForm';
import StatusIndicator from '../components/StatusIndicator';
import PlatformBadge from '../components/PlatformBadge';
import RecentRunSkeleton from '../components/RecentRunSkeleton';
import { getWorkflowRuns, WorkflowRun } from '../lib/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const [isSearchFormOpen, setIsSearchFormOpen] = useState(false);
  const [recentRuns, setRecentRuns] = useState<WorkflowRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRecentRuns();
    
    // Listen for storage changes to update the UI in real-time
    const handleStorageChange = () => {
      console.log('Storage changed, refetching runs...');
      fetchRecentRuns();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('workflow_runs_updated', handleStorageChange);

    // Refresh timestamps every minute to keep "x m ago" accurate
    const timeInterval = setInterval(() => setRecentRuns((r) => [...r]), 60000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('workflow_runs_updated', handleStorageChange);
      clearInterval(timeInterval);
    };
  }, []);

  const fetchRecentRuns = async () => {
    try {
      const { runs } = await getWorkflowRuns(1, 5);
      setRecentRuns(runs);
    } catch (error) {
      console.error('Error fetching recent runs:', error);
      toast.error('Failed to load recent searches');
    } finally {
      setIsLoading(false);
    }
  };



  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - then.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold text-white mb-4"
        >
          Viral Content Identifier
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-gray-300 max-w-2xl mx-auto"
        >
          Analyze viral content across multiple social media platforms with advanced workflow automation
        </motion.p>
      </div>

      {/* Main CTA */}
      <div className="flex justify-center">
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsSearchFormOpen(true)}
          className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center space-x-2"
        >
          <Plus className="h-6 w-6" />
          <span>Add New Search</span>
        </motion.button>
      </div>

      {/* Recent Searches */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Clock className="h-6 w-6 text-red-500" />
            <span>Recent Searches</span>
          </h2>
          <Link
            to="/history"
            className="text-red-400 hover:text-red-300 font-medium transition-colors"
          >
            View All
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[...Array(5)].map((_, i) => (
              <RecentRunSkeleton key={i} />
            ))}
          </div>
        ) : recentRuns.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No recent searches</p>
            <p className="text-gray-500">Start by creating your first search</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {recentRuns.map((run, index) => (
              <motion.div
                key={run.run_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{run.search_query}</h3>
                  <StatusIndicator status={run.status} />
                </div>
                
                <div className="flex items-center space-x-2 mb-2">
                  {run.platforms.map((platform) => (
                    <PlatformBadge key={platform} platform={platform} size="sm" />
                  ))}
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>{formatTimeAgo(run.created_at)}</span>
                  {run.status === 'complete' && (
                    <Link
                      to={`/results/${run.run_id}`}
                      className="text-red-400 hover:text-red-300 font-medium transition-colors flex items-center space-x-1"
                    >
                      <TrendingUp className="h-4 w-4" />
                      <span>View Results</span>
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isSearchFormOpen && (
          <SearchForm
            isOpen={isSearchFormOpen}
            onClose={() => setIsSearchFormOpen(false)}
            onSuccess={(runId) => {
              setIsSearchFormOpen(false);
              fetchRecentRuns();
              toast.success(`Analysis for ${runId} started!`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
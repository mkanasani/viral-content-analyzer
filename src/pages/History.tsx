import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Calendar, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import StatusIndicator from '../components/StatusIndicator';
import PlatformBadge from '../components/PlatformBadge';
import HistoryRowSkeleton from '../components/HistoryRowSkeleton';
import { getWorkflowRuns, searchWorkflowRuns, WorkflowRun } from '../lib/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const History: React.FC = () => {
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchRuns();
    
    // Set up interval to refresh runs every 15 seconds for live updates
    const interval = setInterval(fetchRuns, 15000);
    return () => clearInterval(interval);
  }, [currentPage, statusFilter]);

  useEffect(() => {
    if (searchQuery) {
      handleSearch();
    } else {
      fetchRuns();
    }
  }, [searchQuery]);

  const fetchRuns = async () => {
    try {
      setIsLoading(true);
      const { runs: fetchedRuns, total: totalCount } = await getWorkflowRuns(currentPage, itemsPerPage);
      
      // Filter by status if needed
      let filteredRuns = fetchedRuns;
      if (statusFilter !== 'all') {
        filteredRuns = fetchedRuns.filter(run => run.status === statusFilter);
      }
      
      setRuns(filteredRuns);
      setTotal(totalCount);
      setTotalPages(Math.ceil(totalCount / itemsPerPage));
    } catch (error) {
      console.error('Error fetching runs:', error);
      toast.error('Failed to load workflow history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchRuns();
      return;
    }

    try {
      setIsLoading(true);
      const searchResults = await searchWorkflowRuns(searchQuery);
      
      // Filter by status if needed
      let filteredResults = searchResults;
      if (statusFilter !== 'all') {
        filteredResults = searchResults.filter(run => run.status === statusFilter);
      }
      
      setRuns(filteredResults);
      setTotal(filteredResults.length);
      setTotalPages(Math.ceil(filteredResults.length / itemsPerPage));
    } catch (error) {
      console.error('Error searching runs:', error);
      toast.error('Failed to search workflow history');
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

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Workflow History</h1>
        <div className="text-sm text-gray-400">
          {total} total runs
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Status</option>
              <option value="running">Running</option>
              <option value="complete">Complete</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700/50 overflow-hidden">
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Query
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Platforms
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {[...Array(8)].map((_, i) => (
                  <HistoryRowSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : runs.length === 0 ? (
          <div className="p-8 text-center">
            <Search className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No workflows found</p>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Query
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Platforms
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {runs.map((run, index) => (
                    <motion.tr
                      key={run.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {run.search_query}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {run.run_id}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {run.platforms.map((platform) => (
                            <PlatformBadge key={platform} platform={platform} size="sm" />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusIndicator status={run.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatDuration(run.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatTimeAgo(run.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          {run.status === 'complete' && (
                            <Link
                              to={`/results/${run.run_id}`}
                              className="text-red-400 hover:text-red-300 transition-colors flex items-center space-x-1"
                            >
                              <Eye className="h-4 w-4" />
                              <span>View</span>
                            </Link>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-700/50 px-6 py-3 flex items-center justify-between border-t border-gray-700/50">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  <span className="text-sm text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="text-sm text-gray-400">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, total)} of {total} results
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default History;
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Users, TrendingUp, MessageSquare, Brain, ThumbsUp, Loader2, AlertCircle, Link as LinkIcon, BarChart3, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getWorkflowRunById, getWorkflowResults, WorkflowRun, WorkflowResult } from '../lib/api';
import StatusIndicator from '../components/StatusIndicator';
import PlatformBadge from '../components/PlatformBadge';
import MetricCard from '../components/MetricCard';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';

const Results: React.FC = () => {
  const { runId } = useParams<{ runId: string }>();
  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [results, setResults] = useState<WorkflowResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('Results component mounted, runId:', runId);
    if (runId) {
      fetchData();
    } else {
      console.error('No runId provided');
      setError('No workflow ID provided');
      setIsLoading(false);
    }
  }, [runId]);

  const fetchData = async () => {
    if (!runId) {
      console.error('fetchData called without runId');
      return;
    }

    try {
      console.log('Fetching data for runId:', runId);
      setIsLoading(true);
      setError(null);

      // Fetch workflow run details
      console.log('Calling getWorkflowRunById...');
      const workflowRun = await getWorkflowRunById(runId);
      console.log('Workflow run result:', workflowRun);
      
      if (!workflowRun) {
        console.error('Workflow run not found for ID:', runId);
        setError('Workflow run not found');
        return;
      }
      setRun(workflowRun);

      // Fetch results if workflow is complete
      if (workflowRun.status === 'complete') {
        console.log('Fetching results for completed workflow...');
        const workflowResults = await getWorkflowResults(runId);
        console.log('Workflow results:', workflowResults);
        setResults(workflowResults);
      } else {
        console.log('Workflow not complete, status:', workflowRun.status);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load workflow data');
      toast.error('Failed to load workflow results');
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

  const handleDownloadPdf = async () => {
    if (!pdfContentRef.current || !run) return;
    
    setIsGeneratingPdf(true);
    toast.loading('Generating PDF report...', { id: 'pdf-generation' });
    
    try {
      const element = pdfContentRef.current;
      const filename = `viral-content-report-${run.search_query.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${run.run_id.slice(0, 8)}.pdf`;
      
      const options = {
        margin: 0.5,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#111827' // Match your app's background
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };
      
      await html2pdf().set(options).from(element).save();
      toast.success('PDF report downloaded successfully!', { id: 'pdf-generation' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF report', { id: 'pdf-generation' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const prepareChartData = () => {
    return results.map(result => ({
      platform: result.platform.charAt(0).toUpperCase() + result.platform.slice(1),
      'Audience Sentiment': result.audience_sentiment_score,
      'Tool Value': result.perceived_tool_value,
      'Engagement Quality': result.engagement_quality_score,
    }));
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  console.log('Rendering Results component:', { isLoading, error, run, results });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading workflow results...</p>
        </div>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-4">{error || 'Workflow not found'}</p>
          <Link
            to="/history"
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            Back to History
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/history"
          className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">{run.search_query}</h1>
          <p className="text-gray-400">Workflow Results</p>
        </div>
        <div className="flex items-center space-x-3">
          {run.status === 'complete' && results.length > 0 && (
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
            >
              {isGeneratingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
            </button>
          )}
          <StatusIndicator status={run.status} />
        </div>
      </div>

      {/* PDF Content Container */}
      <div ref={pdfContentRef} className="space-y-6">
        {/* PDF Header - Only visible in PDF */}
        <div className="hidden print:block bg-white p-6 rounded-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Viral Content Analysis Report</h1>
          <p className="text-gray-600 mb-4">Search Query: {run.search_query}</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Run ID:</span> {run.run_id}
            </div>
            <div>
              <span className="font-medium text-gray-700">Generated:</span> {new Date().toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium text-gray-700">Duration:</span> {formatDuration(run.duration)}
            </div>
            <div>
              <span className="font-medium text-gray-700">Platforms:</span> {run.platforms.join(', ')}
            </div>
          </div>
        </div>

        {/* Workflow Info */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-400 text-sm">Run ID</p>
              <p className="text-white font-mono text-sm">{run.run_id}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Created</p>
              <p className="text-white">{formatTimeAgo(run.created_at)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Duration</p>
              <p className="text-white">{formatDuration(run.duration)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Platforms</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {run.platforms.map((platform) => (
                  <PlatformBadge key={platform} platform={platform} size="sm" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {run.status === 'running' && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
            <p className="text-blue-400 font-medium">Workflow is still running...</p>
            <p className="text-gray-400 text-sm mt-2">Results will appear here when the analysis is complete</p>
          </div>
        )}

        {run.status === 'failed' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 font-medium">Workflow failed</p>
            <p className="text-gray-400 text-sm mt-2">Please try running the analysis again</p>
          </div>
        )}

        {run.status === 'complete' && results.length === 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 text-center">
            <AlertCircle className="h-8 w-8 text-yellow-400 mx-auto mb-4" />
            <p className="text-yellow-400 font-medium">No results found</p>
            <p className="text-gray-400 text-sm mt-2">The workflow completed but no data was returned</p>
          </div>
        )}

        {run.status === 'complete' && results.length > 0 && (
          <div className="space-y-6">
            {/* Platform Performance Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50"
            >
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <BarChart3 className="h-6 w-6 mr-2 text-red-500" />
                Platform Performance Overview
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={prepareChartData()}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="platform" 
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={12}
                      domain={[0, 10]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="Audience Sentiment" 
                      fill="#10B981" 
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar 
                      dataKey="Tool Value" 
                      fill="#F59E0B" 
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar 
                      dataKey="Engagement Quality" 
                      fill="#3B82F6" 
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {results.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50"
              >
                {/* Platform Header */}
                <div className="flex items-center justify-between mb-6">
                  <PlatformBadge platform={result.platform} />
                  <span className="text-gray-400 text-sm">
                    {formatTimeAgo(result.created_at)}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <MetricCard
                    title="Audience Sentiment"
                    value={result.audience_sentiment_score}
                    type="sentiment"
                  />
                  <MetricCard
                    title="Tool Value"
                    value={result.perceived_tool_value}
                    type="value"
                  />
                  <MetricCard
                    title="Engagement Quality"
                    value={result.engagement_quality_score}
                    type="engagement"
                  />
                </div>

                {/* Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                  {/* FAQs */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2 text-blue-400" />
                      Frequently Asked Questions
                    </h3>
                    <div className="space-y-2">
                      {result.frequently_asked_questions.length > 0 ? (
                        result.frequently_asked_questions.map((faq, i) => (
                          <div key={i} className="bg-gray-700/50 rounded-lg p-3">
                            <p className="text-gray-300 text-sm">{faq}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No FAQs available</p>
                      )}
                    </div>
                  </div>

                  {/* Behavioral Insights */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <Brain className="h-5 w-5 mr-2 text-purple-400" />
                      Behavioral Insights
                    </h3>
                    <div className="space-y-2">
                      {result.behavioral_insights ? (
                        <div className="bg-gray-700/50 rounded-lg p-3">
                          <p className="text-gray-300 text-sm whitespace-pre-wrap">{result.behavioral_insights}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No insights available</p>
                      )}
                    </div>
                  </div>

                  {/* Feedback Themes */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <ThumbsUp className="h-5 w-5 mr-2 text-green-400" />
                      Feedback Themes
                    </h3>
                    <div className="space-y-2">
                      {result.feedback_themes ? (
                        <div className="bg-gray-700/50 rounded-lg p-3">
                          <p className="text-gray-300 text-sm whitespace-pre-wrap">{result.feedback_themes}</p>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No themes available</p>
                      )}
                    </div>
                  </div>

                  {/* Relevant URLs */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                      <LinkIcon className="h-5 w-5 mr-2 text-orange-400" />
                      Relevant URLs
                    </h3>
                    <div className="space-y-2">
                      {result.urls && result.urls.length > 0 ? (
                        result.urls.map((url, i) => (
                          <div key={i} className="bg-gray-700/50 rounded-lg p-3">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-400 hover:text-orange-300 text-sm break-all transition-colors flex items-start space-x-2"
                            >
                              <LinkIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>{url}</span>
                            </a>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No URLs available</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;
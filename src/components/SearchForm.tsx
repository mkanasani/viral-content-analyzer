import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, AlertCircle, Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { triggerWorkflow, WorkflowPayload } from '../lib/api';

import toast from 'react-hot-toast';

interface SearchFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (runId: string) => void;
}

const platforms = [
  { id: 'tiktok', name: 'TikTok', icon: Youtube, color: 'from-pink-500 to-red-500' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'from-purple-500 to-pink-500' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'from-red-500 to-red-600' },
  { id: 'twitter', name: 'X (Twitter)', icon: '/icons/x-logo.svg', color: 'from-blue-400 to-blue-500' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'from-blue-600 to-blue-700' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'from-blue-500 to-blue-600' },
];

const SearchForm: React.FC<SearchFormProps> = ({ isOpen, onClose, onSuccess }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!searchQuery.trim()) {
      newErrors.searchQuery = 'Search query is required';
    }
    
    if (Object.values(selectedPlatforms).every(v => !v)) {
      newErrors.platforms = 'At least one platform must be selected';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const sessionId = uuidv4();
      const payload: WorkflowPayload = {
        search_query: searchQuery,
        session_id: sessionId,
        request_initiated_timestamp: new Date().toISOString(),
        search_tiktok: !!selectedPlatforms['tiktok'],
        search_instagram: !!selectedPlatforms['instagram'],
        search_youtube: !!selectedPlatforms['youtube'],
        search_twitter: !!selectedPlatforms['twitter'],
        search_linkedin: !!selectedPlatforms['linkedin'],
        search_facebook: !!selectedPlatforms['facebook'],
      };

      const runId = await triggerWorkflow(payload);
      
      // Close and reset form on success
      toast.success('Analysis started! You can track progress in the history tab.');
      


      onClose();
      setSearchQuery('');
      setSelectedPlatforms({});
      setErrors({});

      toast('Results will be available in 45-60 seconds. Check the History page for updates.');
      
      onSuccess?.(runId);
    } catch (error) {
      console.error('Error submitting search:', error);
      toast.error('Failed to trigger workflow. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => ({
      ...prev,
      [platformId]: !prev[platformId]
    }));
    
    // Clear platform error if one is selected
    if (errors.platforms) {
      setErrors(prev => ({ ...prev, platforms: '' }));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-800 rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">New Search</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Search Query */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search Query
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (errors.searchQuery) {
                      setErrors(prev => ({ ...prev, searchQuery: '' }));
                    }
                  }}
                  placeholder="Enter search term or hashtag..."
                  className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    errors.searchQuery 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-600 focus:ring-red-500'
                  }`}
                />
                {errors.searchQuery && (
                  <div className="flex items-center mt-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.searchQuery}
                  </div>
                )}
              </div>

              {/* Platform Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Select Platforms
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {platforms.map((platform) => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => togglePlatform(platform.id)}
                      title={platform.name}
                      className={`p-3 rounded-lg border transition-all duration-200 ${
                        selectedPlatforms[platform.id]
                          ? `bg-gradient-to-r ${platform.color} border-transparent text-white`
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                      } flex items-center justify-center`}
                    >
                      {typeof platform.icon === 'string' ? (
                        <img 
                          src={platform.icon} 
                          alt={platform.name}
                          className="h-6 w-6"
                        />
                      ) : (
                        <platform.icon className="h-6 w-6" />
                      )}
                    </button>
                  ))}
                </div>
                {errors.platforms && (
                  <div className="flex items-center mt-2 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.platforms}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 px-4 rounded-lg font-medium hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Starting Analysis...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Analyze Content
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchForm;
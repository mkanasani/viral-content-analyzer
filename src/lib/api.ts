import { supabase } from './supabaseClient';
import { startPollingService } from './pollingService';
import { WorkflowRun, WorkflowResult, ViralContentResult } from './types';

// Re-export types for other components
export type { WorkflowRun, WorkflowResult, ViralContentResult };

export interface WorkflowPayload {
  search_query: string;
  session_id: string;
  request_initiated_timestamp: string;
  search_tiktok: boolean;
  search_instagram: boolean;
  search_youtube: boolean;
  search_twitter: boolean;
  search_linkedin: boolean;
  search_facebook: boolean;
}

export const triggerWorkflow = async (payload: WorkflowPayload): Promise<string> => {
  const runId = payload.session_id;
  const platforms = Object.entries(payload)
    .filter(([key, value]) => key.startsWith('search_') && value)
    .map(([key]) => key.replace('search_', ''));

  const workflowRun: WorkflowRun = {
    run_id: runId,
    search_query: payload.search_query,
    platforms: platforms,
    status: 'running',
    created_at: payload.request_initiated_timestamp,
  };

  try {
    // Store in localStorage
    const existingRuns = JSON.parse(localStorage.getItem('workflow_runs') || '[]');
    existingRuns.unshift(workflowRun);
    localStorage.setItem('workflow_runs', JSON.stringify(existingRuns));
    // Notify listeners (e.g., Dashboard) of storage update
    window.dispatchEvent(new Event('storage'));

    // Ensure polling service is running
    startPollingService();

    // Trigger the actual workflow via webhook (if configured)
    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
    if (webhookUrl) {
      // Fire-and-forget to avoid blocking the UI. Network errors will be logged but won't block.
      fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(err => console.error('Webhook request failed:', err));
    }

    return runId;
  } catch (error) {
    console.error('Error triggering workflow:', error);
    throw error;
  }
};

export const getWorkflowRuns = async (page: number = 1, limit: number = 10): Promise<{ runs: WorkflowRun[], total: number }> => {
  try {
    // Get runs from localStorage
    const existingRuns = JSON.parse(localStorage.getItem('workflow_runs') || '[]') as WorkflowRun[];
    
    // Sort by created_at descending
    const sortedRuns = existingRuns.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRuns = sortedRuns.slice(startIndex, endIndex);
    
    return {
      runs: paginatedRuns,
      total: existingRuns.length
    };
  } catch (error) {
    console.error('Error fetching workflow runs:', error);
    return { runs: [], total: 0 };
  }
};

export const searchWorkflowRuns = async (query: string): Promise<WorkflowRun[]> => {
  try {
    // Get runs from localStorage
    const existingRuns = JSON.parse(localStorage.getItem('workflow_runs') || '[]') as WorkflowRun[];
    
    // Filter by search query
    const filteredRuns = existingRuns.filter(run => 
      run.search_query.toLowerCase().includes(query.toLowerCase()) ||
      run.run_id.toLowerCase().includes(query.toLowerCase())
    );
    
    // Sort by created_at descending
    return filteredRuns.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (error) {
    console.error('Error searching workflow runs:', error);
    return [];
  }
};

export const getWorkflowRunById = async (runId: string): Promise<WorkflowRun | null> => {
  try {
    // Get runs from localStorage
    const existingRuns = JSON.parse(localStorage.getItem('workflow_runs') || '[]') as WorkflowRun[];
    
    // Find the run by ID
    const run = existingRuns.find(r => r.run_id === runId);
    return run || null;
  } catch (error) {
    console.error('Error fetching workflow run by ID:', error);
    return null;
  }
};

export const getWorkflowResults = async (runId: string): Promise<WorkflowResult[]> => {
  try {
    // Query Supabase for results
    const { data, error } = await supabase
      .from('viral-content-identifier')
      .select('*')
      .eq('id', runId);

    if (error) {
      console.error('Error fetching workflow results:', error);
      return [];
    }

    // Sanitize data to ensure correct types
    const sanitizedData = data.map(item => ({
      ...item,
      frequently_asked_questions: Array.isArray(item.frequently_asked_questions) ? item.frequently_asked_questions : [],
      behavioral_insights: typeof item.behavioral_insights === 'string' ? item.behavioral_insights : '',
      feedback_themes: typeof item.feedback_themes === 'string' ? item.feedback_themes : '',
    }));

    return sanitizedData || [];
  } catch (error) {
    console.error('Error fetching workflow results:', error);
    return [];
  }
};
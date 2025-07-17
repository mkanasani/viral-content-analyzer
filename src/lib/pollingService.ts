import { supabase } from './supabaseClient';
import { WorkflowRun } from './types';

const POLLING_INTERVAL = 15000; // 15 seconds
const TIMEOUT_MINUTES = 10;

let pollingIntervalId: number | null = null;

/**
 * Checks all 'running' workflows and updates their status based on Supabase results.
 */
export const checkRunningWorkflows = async () => {
  const allRuns: WorkflowRun[] = JSON.parse(localStorage.getItem('workflow_runs') || '[]');
  const runningRuns = allRuns.filter(run => run.status === 'running');

  console.log(`Polling check: Found ${runningRuns.length} running workflow(s)`);

  if (runningRuns.length === 0) {
    console.log('No active workflows, but keeping polling service running');
    return;
  }

  for (const run of runningRuns) {
    const now = new Date();
    const createdTime = new Date(run.created_at);
    const timeDiffMinutes = (now.getTime() - createdTime.getTime()) / (1000 * 60);

    console.log(`Checking run ${run.run_id}: platforms=${run.platforms.join(',')}, age=${Math.floor(timeDiffMinutes)}min`);

    try {
      // Query Supabase for results with this session ID
      const { data: results, error } = await supabase
        .from('viral-content-identifier')
        .select('platform')
        .eq('id', run.run_id);

      if (error) {
        console.error(`Error fetching results for run ${run.run_id}:`, error);
        continue;
      }

      console.log(`Run ${run.run_id}: Found ${results.length} results in Supabase`);

      if (results.length > 0) {
        const receivedPlatforms = results.map(r => r.platform.toLowerCase());
        const requestedPlatforms = run.platforms.map(p => p.toLowerCase());
        
        console.log(`Run ${run.run_id}: Requested=[${requestedPlatforms.join(',')}], Received=[${receivedPlatforms.join(',')}]`);
        
        // Check if we have at least one result for each requested platform
        const allPlatformsReturned = requestedPlatforms.every(platform => 
          receivedPlatforms.includes(platform)
        );

        if (allPlatformsReturned) {
          console.log(`✅ Run ${run.run_id} is complete - all platforms returned results`);
          updateRunStatus(run.run_id, 'complete', timeDiffMinutes);
        } else if (timeDiffMinutes > TIMEOUT_MINUTES) {
          console.log(`⏰ Run ${run.run_id} timed out with partial results - marking complete`);
          updateRunStatus(run.run_id, 'complete', TIMEOUT_MINUTES);
        } else {
          console.log(`⏳ Run ${run.run_id} still waiting for platforms: ${requestedPlatforms.filter(p => !receivedPlatforms.includes(p)).join(',')}`);
        }
      } else if (timeDiffMinutes > TIMEOUT_MINUTES) {
        console.log(`❌ Run ${run.run_id} timed out with no results - marking failed`);
        updateRunStatus(run.run_id, 'failed', TIMEOUT_MINUTES);
      } else {
        console.log(`⏳ Run ${run.run_id} still waiting for first results (${Math.floor(timeDiffMinutes)}min elapsed)`);
      }
    } catch (e) {
      console.error(`Unexpected error polling run ${run.run_id}:`, e);
    }
  }
};

/**
 * Updates the status of a specific workflow run in localStorage.
 */
const updateRunStatus = (runId: string, status: 'complete' | 'failed', durationMinutes: number) => {
  const allRuns: WorkflowRun[] = JSON.parse(localStorage.getItem('workflow_runs') || '[]');
  const runIndex = allRuns.findIndex(r => r.run_id === runId);

  if (runIndex !== -1) {
    console.log(`📝 Updating run ${runId} status to ${status}`);
    allRuns[runIndex].status = status;
    allRuns[runIndex].duration = Math.floor(durationMinutes * 60);
    allRuns[runIndex].updated_at = new Date().toISOString();
    localStorage.setItem('workflow_runs', JSON.stringify(allRuns));
    
    // Notify listeners in same and other tabs
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('workflow_runs_updated'));
  } else {
    console.warn(`⚠️ Could not find run ${runId} to update status`);
  }
};

/**
 * Starts the polling service.
 */
export const startPollingService = () => {
  if (pollingIntervalId) {
    console.log('Polling service is already running');
    return;
  }
  
  console.log('🚀 Starting workflow polling service...');
  
  // Run once immediately, then set up the interval
  checkRunningWorkflows();
  pollingIntervalId = window.setInterval(checkRunningWorkflows, POLLING_INTERVAL);

  // Handle visibility changes - run check when tab becomes visible
  const visibilityHandler = () => {
    if (!document.hidden) {
      console.log('Tab became visible, running immediate polling check');
      checkRunningWorkflows();
    }
  };
  document.addEventListener('visibilitychange', visibilityHandler);
};

/**
 * Stops the polling service.
 */
export const stopPollingService = () => {
  if (pollingIntervalId) {
    console.log('🛑 Stopping workflow polling service');
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
  }
};
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

  if (runningRuns.length === 0) {
    console.log('No active workflows. Stopping polling service.');
    stopPollingService();
    return;
  }

  console.log(`Polling for ${runningRuns.length} running workflow(s)...`);

  for (const run of runningRuns) {
    const now = new Date();
    const createdTime = new Date(run.created_at);
    const timeDiffMinutes = (now.getTime() - createdTime.getTime()) / (1000 * 60);

    try {
      const { data: results, error } = await supabase
        .from('viral-content-identifier')
        .select('platform')
        .eq('id', run.run_id);

      if (error) {
        console.error(`Error fetching results for run ${run.run_id}:`, error);
        continue; // Check next run
      }

      const receivedPlatforms = Array.from(new Set(results.map(r => (r as any).platform.toLowerCase())));
      const allPlatformsReturned = run.platforms.every(p => receivedPlatforms.includes(p.toLowerCase()));
      const isTimedOut = timeDiffMinutes > TIMEOUT_MINUTES;

      if (allPlatformsReturned) {
        console.log(`Run ${run.run_id} is complete. Updating status.`);
        updateRunStatus(run.run_id, 'complete', timeDiffMinutes);
      } else if (isTimedOut) {
        if (results.length > 0) {
          console.log(`Run ${run.run_id} timed out with partial results. Marking complete.`);
          updateRunStatus(run.run_id, 'complete', TIMEOUT_MINUTES);
        } else {
          console.log(`Run ${run.run_id} timed out with no results. Marking failed.`);
          updateRunStatus(run.run_id, 'failed', TIMEOUT_MINUTES);
        }
      }
    } catch (e) {
      console.error(`An unexpected error occurred while polling for run ${run.run_id}:`, e);
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
    allRuns[runIndex].status = status;
    allRuns[runIndex].duration = Math.floor(durationMinutes * 60);
    allRuns[runIndex].updated_at = new Date().toISOString();
    localStorage.setItem('workflow_runs', JSON.stringify(allRuns));
    // Notify listeners in same and other tabs
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('workflow_runs_updated'));
  }
};

/**
 * Starts the polling service.
 */
export const startPollingService = () => {
  if (pollingIntervalId) {
    console.log('Polling service is already running.');
    return;
  }
  console.log('Starting workflow polling service...');
  // Run once immediately, then set up the interval
  checkRunningWorkflows();
  pollingIntervalId = window.setInterval(checkRunningWorkflows, POLLING_INTERVAL);

  // If tab was hidden, timers may be throttled. When user returns, run an immediate check.
  const visibilityHandler = () => {
    if (!document.hidden) {
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
    console.log('Stopping workflow polling service...');
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
  }
};

import { supabase } from './supabaseClient';
import { WorkflowRun } from './types';

let realtimeSubscribed = false;

/**
 * Starts Supabase realtime listener for inserts on the viral-content-identifier table.
 * When a new row for a platform is inserted, we check if that completes the workflow
 * for the corresponding run_id and update its status in localStorage.
 */
export const startRealtimeService = () => {
  if (realtimeSubscribed) {
    console.log('Realtime service already running.');
    return;
  }

  console.log('Starting Supabase realtime listener…');

  supabase
    .channel('vc-identifier-inserts')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'viral-content-identifier' },
      async (payload) => {
        try {
          const newRow = payload.new as any;
          const runId = newRow.id as string;

          // Load existing runs
          const allRuns: WorkflowRun[] = JSON.parse(localStorage.getItem('workflow_runs') || '[]');
          const runIndex = allRuns.findIndex((r) => r.run_id === runId);
          if (runIndex === -1) return; // Not a workflow initiated from this browser

          const run = allRuns[runIndex];
          if (run.status !== 'running') return; // Already completed/failed

          // Query distinct platforms for this runId to see if all requested arrived
          const { data, error } = await supabase
            .from('viral-content-identifier')
            .select('platform')
            .eq('id', runId);

          if (error) {
            console.error('Realtime check failed:', error);
            return;
          }

          const received = Array.from(
            new Set(data.map((row: any) => (row.platform as string).toLowerCase())),
          );
          const allReceived = run.platforms.every((p) => received.includes(p.toLowerCase()));

          if (allReceived) {
            run.status = 'complete';
            run.updated_at = new Date().toISOString();
            run.duration = Math.floor((Date.now() - new Date(run.created_at).getTime()) / 1000);
            allRuns[runIndex] = run;
            localStorage.setItem('workflow_runs', JSON.stringify(allRuns));
            window.dispatchEvent(new Event('workflow_runs_updated'));
            console.log(`Run ${runId} completed via realtime.`);
          }
        } catch (err) {
          console.error('Error in realtime handler:', err);
        }
      },
    )
    .subscribe();

  realtimeSubscribed = true;
};

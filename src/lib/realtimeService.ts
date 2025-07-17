import { supabase } from './supabaseClient';
import { WorkflowRun } from './types';

let realtimeSubscribed = false;

/**
 * Starts Supabase realtime listener for inserts on the viral-content-identifier table.
 * When a new row is inserted, check if it completes the workflow for the corresponding run_id.
 */
export const startRealtimeService = () => {
  if (realtimeSubscribed) {
    console.log('Realtime service already running');
    return;
  }

  console.log('🔄 Starting Supabase realtime listener...');

  supabase
    .channel('vc-identifier-inserts')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'viral-content-identifier' },
      async (payload) => {
        try {
          const newRow = payload.new as any;
          const runId = newRow.id as string;
          const platform = newRow.platform as string;

          console.log(`🔔 Realtime: New result received for run ${runId}, platform: ${platform}`);

          // Load existing runs from localStorage
          const allRuns: WorkflowRun[] = JSON.parse(localStorage.getItem('workflow_runs') || '[]');
          const runIndex = allRuns.findIndex((r) => r.run_id === runId);
          
          if (runIndex === -1) {
            console.log(`⚠️ Realtime: Run ${runId} not found in localStorage (may be from different browser)`);
            return;
          }

          const run = allRuns[runIndex];
          if (run.status !== 'running') {
            console.log(`⚠️ Realtime: Run ${runId} is not in running state (current: ${run.status})`);
            return;
          }

          console.log(`🔍 Realtime: Checking completion for run ${runId}`);

          // Query all results for this runId to see if we have all platforms
          const { data, error } = await supabase
            .from('viral-content-identifier')
            .select('platform')
            .eq('id', runId);

          if (error) {
            console.error('❌ Realtime: Error querying results:', error);
            return;
          }

          const receivedPlatforms = data.map((row: any) => row.platform.toLowerCase());
          const requestedPlatforms = run.platforms.map(p => p.toLowerCase());
          
          console.log(`🔍 Realtime: Run ${runId} - Requested=[${requestedPlatforms.join(',')}], Received=[${receivedPlatforms.join(',')}]`);

          // Check if we have results for all requested platforms
          const allPlatformsReceived = requestedPlatforms.every((platform) => 
            receivedPlatforms.includes(platform)
          );

          if (allPlatformsReceived) {
            console.log(`✅ Realtime: Run ${runId} completed - all platforms received`);
            
            // Update the run status
            run.status = 'complete';
            run.updated_at = new Date().toISOString();
            run.duration = Math.floor((Date.now() - new Date(run.created_at).getTime()) / 1000);
            run.received_platforms = receivedPlatforms;
            
            allRuns[runIndex] = run;
            localStorage.setItem('workflow_runs', JSON.stringify(allRuns));
            
            // Notify listeners
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('workflow_runs_updated'));
          } else {
            console.log(`⏳ Realtime: Run ${runId} still waiting for platforms: ${requestedPlatforms.filter(p => !receivedPlatforms.includes(p)).join(',')}`);
          }
        } catch (err) {
          console.error('❌ Realtime: Error in handler:', err);
        }
      }
    )
    .subscribe((status) => {
      console.log('🔄 Realtime subscription status:', status);
    });

  realtimeSubscribed = true;
};

/**
 * Stops the realtime service (for cleanup if needed).
 */
export const stopRealtimeService = () => {
  if (realtimeSubscribed) {
    console.log('🛑 Stopping Supabase realtime service');
    supabase.removeAllChannels();
    realtimeSubscribed = false;
  }
};
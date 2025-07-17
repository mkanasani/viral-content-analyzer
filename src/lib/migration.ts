import { supabase } from './supabaseClient';

// Force fix all stuck running statuses - runs only on app startup
export const forceFixStuckStatuses = async (): Promise<void> => {
  console.log('🔧 Checking for stuck running statuses...');
  
  try {
    // Get all existing runs from localStorage
    const existingRuns = JSON.parse(localStorage.getItem('workflow_runs') || '[]');
    
    if (existingRuns.length === 0) {
      console.log('No existing runs found');
      return;
    }

    console.log(`Checking ${existingRuns.length} existing runs for stuck statuses`);
    const now = new Date();
    let hasUpdates = false;

    // Try to fetch all existing records from Supabase, but continue if it fails
    let supabaseRecords: any[] = [];
    try {
      const { data: existingRecords, error } = await supabase
        .from('viral-content-identifier')
        .select('*');

      if (error) {
        console.warn('⚠️ Could not fetch Supabase records:', error.message);
        console.log('Continuing with status fixes using localStorage only...');
      } else {
        supabaseRecords = existingRecords || [];
        console.log(`Found ${supabaseRecords.length} existing Supabase records`);
      }
    } catch (supabaseError) {
      console.warn('⚠️ Supabase connection failed:', supabaseError);
      console.log('Continuing with status fixes using localStorage only...');
    }

    // Fix each stuck run
    const updatedRuns = existingRuns.map((run: any) => {
      const createdTime = new Date(run.created_at);
      const timeDiffMinutes = (now.getTime() - createdTime.getTime()) / (1000 * 60);
      
      // If status is running and it's been more than 10 minutes
      if (run.status === 'running' && timeDiffMinutes > 10) {
        console.log(`🔧 FIXING stuck 'running' status for run ${run.run_id} (${Math.floor(timeDiffMinutes)} minutes old)`);
        hasUpdates = true;
        
        // Check if this run has results in Supabase
        const runResults = supabaseRecords.filter(record => record.id === run.run_id);
        
        if (runResults.length > 0) {
          const receivedPlatforms = runResults.map(r => r.platform.toLowerCase());
          const requestedPlatforms = run.platforms.map((p: string) => p.toLowerCase());
          
          console.log(`✅ Found ${runResults.length} results for run ${run.run_id}, marking as COMPLETE`);
          console.log(`   Requested: [${requestedPlatforms.join(',')}], Received: [${receivedPlatforms.join(',')}]`);
          
          return {
            ...run,
            status: 'complete',
            received_platforms: receivedPlatforms,
            duration: run.duration || Math.floor(timeDiffMinutes * 60),
            updated_at: now.toISOString()
          };
        } else {
          console.log(`❌ No results found for run ${run.run_id}, marking as FAILED`);
          return {
            ...run,
            status: 'failed',
            duration: Math.floor(timeDiffMinutes * 60),
            updated_at: now.toISOString()
          };
        }
      }
      
      return run;
    });

    // Save updated runs back to localStorage
    if (hasUpdates) {
      localStorage.setItem('workflow_runs', JSON.stringify(updatedRuns));
      console.log('✅ Updated localStorage with fixed statuses');
      
      // Notify listeners
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('workflow_runs_updated'));
    } else {
      console.log('No status updates needed');
    }

  } catch (error) {
    console.error('❌ Error during status fix:', error);
  }
};

// Legacy migration function - keeping for compatibility but not using
export const migrateExistingData = async (): Promise<void> => {
  console.log('Legacy migration function called - skipping');
};

export const isMigrationCompleted = (): boolean => {
  return true; // Always return true to skip legacy migration
};

export const resetMigration = (): void => {
  console.log('Reset migration called - no action needed');
};
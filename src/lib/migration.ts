import { supabase } from './supabaseClient';

// Force fix all stuck running statuses - runs every time
export const forceFixStuckStatuses = async (): Promise<void> => {
  console.log('FORCE FIXING all stuck running statuses...');
  
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
        console.warn('Warning: Could not fetch Supabase records:', error.message);
        console.log('Continuing with status fixes using localStorage only...');
      } else {
        supabaseRecords = existingRecords || [];
        console.log(`Found ${supabaseRecords.length} existing Supabase records`);
      }
    } catch (supabaseError) {
      console.warn('Warning: Supabase connection failed:', supabaseError);
      console.log('Continuing with status fixes using localStorage only...');
    }

    // Fix each stuck run
    const updatedRuns = existingRuns.map((run: any) => {
      const createdTime = new Date(run.created_at);
      const timeDiffMinutes = (now.getTime() - createdTime.getTime()) / (1000 * 60);
      
      console.log(`Run ${run.run_id}: status=${run.status}, age=${Math.floor(timeDiffMinutes)} minutes`);
      
      // If status is running and it's been more than 10 minutes
      if (run.status === 'running' && timeDiffMinutes > 10) {
        console.log(`🔧 FIXING stuck 'running' status for run ${run.run_id} (${Math.floor(timeDiffMinutes)} minutes old)`);
        hasUpdates = true;
        
        // Check if this run has results in Supabase
        const runResults = supabaseRecords.filter(record => record.id === run.run_id);
        
        if (runResults.length > 0) {
          console.log(`✅ Found ${runResults.length} results for run ${run.run_id}, marking as COMPLETE`);
          return {
            ...run,
            status: 'complete',
            received_platforms: runResults.map(r => r.platform).filter(Boolean),
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
      console.log('✅ SUCCESSFULLY updated localStorage with fixed statuses');
      

    } else {
      console.log('No status updates needed');
    }

  } catch (error) {
    console.error('❌ Error during force status fix:', error);
  }
};

// Migration function to update existing records and fix stuck statuses
export const migrateExistingData = async (): Promise<void> => {
  console.log('Starting migration of existing data...');
  
  try {
    // 1. Get all existing runs from localStorage
    const existingRuns = JSON.parse(localStorage.getItem('workflow_runs') || '[]');
    
    if (existingRuns.length === 0) {
      console.log('No existing runs found');
      return;
    }

    console.log(`Found ${existingRuns.length} existing runs`);
    const now = new Date();
    let hasUpdates = false;

    // 2. Try to fetch all existing records from Supabase
    let supabaseRecords: any[] = [];
    try {
      const { data: existingRecords, error } = await supabase
        .from('viral-content-identifier')
        .select('*');

      if (error) {
        console.warn('Warning: Could not fetch Supabase records:', error.message);
        console.log('Continuing with migration using localStorage only...');
      } else {
        supabaseRecords = existingRecords || [];
        console.log(`Found ${supabaseRecords.length} existing Supabase records`);
      }
    } catch (supabaseError) {
      console.warn('Warning: Supabase connection failed:', supabaseError);
      console.log('Continuing with migration using localStorage only...');
    }

    // 3. Update Supabase records to fix score scaling
    if (supabaseRecords.length > 0) {
      console.log('Updating Supabase records to fix score scaling...');
      
      const updatePromises = supabaseRecords.map(async (record: any) => {
        const updatedRecord = {
          audience_sentiment_score: record.audience_sentiment_score ? record.audience_sentiment_score * 2 : null,
          perceived_tool_value: record.perceived_tool_value ? record.perceived_tool_value * 2 : null,
          engagement_quality_score: record.engagement_quality_score ? record.engagement_quality_score * 2 : null,
          updated_at: new Date().toISOString()
        };

        console.log(`Migrating record ${record.id}:`, {
          old: {
            sentiment: record.audience_sentiment_score,
            value: record.perceived_tool_value,
            engagement: record.engagement_quality_score
          },
          new: {
            sentiment: updatedRecord.audience_sentiment_score,
            value: updatedRecord.perceived_tool_value,
            engagement: updatedRecord.engagement_quality_score
          }
        });

        const { error: updateError } = await supabase
          .from('viral-content-identifier')
          .update(updatedRecord)
          .eq('id', record.id);

        if (updateError) {
          console.error(`Error updating record ${record.id}:`, updateError);
        } else {
          console.log(`Successfully migrated record ${record.id}`);
        }
      });

      // Wait for all Supabase updates to complete
      await Promise.all(updatePromises);
    }

    // 4. Now fix localStorage statuses
    const updatedRuns = existingRuns.map((run: any) => {
      const createdTime = new Date(run.created_at);
      const timeDiffMinutes = (now.getTime() - createdTime.getTime()) / (1000 * 60);
      
      // If status is running and it's been more than 10 minutes
      if (run.status === 'running' && timeDiffMinutes > 10) {
        console.log(`Fixing stuck 'running' status for run ${run.run_id} (${Math.floor(timeDiffMinutes)} minutes old)`);
        hasUpdates = true;
        
        // Check if this run has results in Supabase
        const runResults = supabaseRecords.filter(record => record.id === run.run_id);
        
        if (runResults.length > 0) {
          console.log(`Found ${runResults.length} results for run ${run.run_id}, marking as complete`);
          return {
            ...run,
            status: 'complete',
            received_platforms: runResults.map(r => r.platform).filter(Boolean),
            duration: run.duration || Math.floor(timeDiffMinutes * 60),
            updated_at: now.toISOString()
          };
        } else {
          console.log(`No results found for run ${run.run_id}, marking as failed`);
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

    // 5. Save updated runs back to localStorage
    if (hasUpdates) {
      localStorage.setItem('workflow_runs', JSON.stringify(updatedRuns));
      console.log('Updated localStorage with fixed statuses');
    } else {
      console.log('No status updates needed');
    }

    // 6. Mark migration as completed
    localStorage.setItem('data_migration_completed', 'true');
    localStorage.setItem('data_migration_date', new Date().toISOString());

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    // Mark as completed even if there were errors to prevent infinite retries
    localStorage.setItem('data_migration_completed', 'true');
    localStorage.setItem('data_migration_date', new Date().toISOString());
  }
};

// Check if migration has been run
export const isMigrationCompleted = (): boolean => {
  return localStorage.getItem('data_migration_completed') === 'true';
};

// Force re-run migration (for testing)
export const resetMigration = (): void => {
  localStorage.removeItem('data_migration_completed');
  localStorage.removeItem('data_migration_date');
};
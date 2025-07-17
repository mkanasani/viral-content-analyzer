export interface WorkflowRun {
  id?: string;
  run_id: string;
  search_query: string;
  platforms: string[];
  status: 'running' | 'complete' | 'failed';
  created_at: string;
  updated_at?: string;
  duration?: number;
  received_platforms?: string[];
}

export interface WorkflowResult {
  id: string;
  platform: string;
  audience_sentiment_score: number;
  perceived_tool_value: number;
  engagement_quality_score: number;
  frequently_asked_questions: string[];
  behavioral_insights: string[];
  feedback_themes: string[];
  created_at: string;
}

export interface ViralContentResult {
  id: string;
  platform: string;
  audience_sentiment_score: number;
  perceived_tool_value: number;
  engagement_quality_score: number;
  frequently_asked_questions: string[];
  behavioral_insights: string[];
  feedback_themes: string[];
  created_at: string;
}
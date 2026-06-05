CREATE TABLE workflow_execution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  trigger_data JSONB DEFAULT '{}'::jsonb,
  action_result JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('success', 'failure'))
);

ALTER TABLE workflow_execution_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY view_history
  ON workflow_execution_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY create_history
  ON workflow_execution_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_wf_exec_history_workflow ON workflow_execution_history(workflow_id);

CREATE INDEX idx_wf_exec_history_time ON workflow_execution_history(executed_at DESC);
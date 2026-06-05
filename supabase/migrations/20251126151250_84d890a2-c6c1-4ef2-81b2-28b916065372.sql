-- Add approval workflow fields to time_entries
ALTER TABLE time_entries
ADD COLUMN approval_status text NOT NULL DEFAULT 'pending',
ADD COLUMN approved_by uuid,
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN rejection_reason text;

-- Add check constraint for approval_status
ALTER TABLE time_entries
ADD CONSTRAINT time_entries_approval_status_check 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Create index for approval queries
CREATE INDEX idx_time_entries_approval_status ON time_entries(approval_status);
CREATE INDEX idx_time_entries_approved_by ON time_entries(approved_by);

-- Create approval history table
CREATE TABLE time_entry_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id uuid NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('approved', 'rejected')),
  approved_by uuid NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL
);

-- Enable RLS on time_entry_approvals
ALTER TABLE time_entry_approvals ENABLE ROW LEVEL SECURITY;

-- RLS policies for time_entry_approvals
CREATE POLICY "Users can view own time entry approvals"
  ON time_entry_approvals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own time entry approvals"
  ON time_entry_approvals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for approval history queries
CREATE INDEX idx_time_entry_approvals_time_entry_id ON time_entry_approvals(time_entry_id);
CREATE INDEX idx_time_entry_approvals_user_id ON time_entry_approvals(user_id);
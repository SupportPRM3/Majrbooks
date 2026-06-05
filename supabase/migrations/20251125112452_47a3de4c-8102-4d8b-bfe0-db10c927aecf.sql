-- Add project tracking to time entries
ALTER TABLE time_entries 
ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX idx_time_entries_entry_date ON time_entries(entry_date);

-- Add project_id to timesheets for better tracking
ALTER TABLE timesheets 
ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX idx_timesheets_project_id ON timesheets(project_id);
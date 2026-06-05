-- Add billable tracking to time entries
ALTER TABLE time_entries 
ADD COLUMN is_billable boolean NOT NULL DEFAULT true;

-- Add billing rate to projects for profitability analysis
ALTER TABLE projects 
ADD COLUMN billing_rate numeric DEFAULT 0;

-- Add target utilization percentage to employees (e.g., 80% = 0.80)
ALTER TABLE employees 
ADD COLUMN target_utilization numeric DEFAULT 0.80;

-- Create index for billable filtering
CREATE INDEX idx_time_entries_billable ON time_entries(is_billable);

-- Create index for project billing rate queries
CREATE INDEX idx_projects_billing_rate ON projects(billing_rate);
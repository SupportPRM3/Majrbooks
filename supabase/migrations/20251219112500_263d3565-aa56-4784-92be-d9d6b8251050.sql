-- Create project milestones table
CREATE TABLE public.project_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project team members junction table
CREATE TABLE public.project_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL,
  UNIQUE(project_id, employee_id)
);

-- Enable RLS
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_milestones
CREATE POLICY "Users can view own project milestones"
ON public.project_milestones FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own project milestones"
ON public.project_milestones FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project milestones"
ON public.project_milestones FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own project milestones"
ON public.project_milestones FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for project_team_members
CREATE POLICY "Users can view own project team members"
ON public.project_team_members FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own project team members"
ON public.project_team_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own project team members"
ON public.project_team_members FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own project team members"
ON public.project_team_members FOR DELETE
USING (auth.uid() = user_id);
-- Create permission levels enum
CREATE TYPE public.permission_level AS ENUM ('admin', 'accountant', 'employee');

-- Create team_members table for employee management
CREATE TABLE public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    owner_id UUID NOT NULL,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role permission_level NOT NULL DEFAULT 'employee',
    is_active BOOLEAN NOT NULL DEFAULT true,
    can_edit BOOLEAN NOT NULL DEFAULT false,
    invite_token TEXT,
    invite_sent_at TIMESTAMP WITH TIME ZONE,
    invite_accepted_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create module_access table for granular module permissions
CREATE TABLE public.module_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_member_id UUID REFERENCES public.team_members(id) ON DELETE CASCADE NOT NULL,
    module_name TEXT NOT NULL,
    can_view BOOLEAN NOT NULL DEFAULT false,
    can_edit BOOLEAN NOT NULL DEFAULT false,
    can_delete BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(team_member_id, module_name)
);

-- Create audit_logs table for activity tracking
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    user_id UUID,
    team_member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_members
CREATE POLICY "Owners can manage their team members"
ON public.team_members
FOR ALL
USING (auth.uid() = owner_id);

CREATE POLICY "Team members can view their own record"
ON public.team_members
FOR SELECT
USING (auth.uid() = user_id);

-- RLS policies for module_access
CREATE POLICY "Owners can manage module access"
ON public.module_access
FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.id = module_access.team_member_id
    AND team_members.owner_id = auth.uid()
));

CREATE POLICY "Team members can view their own module access"
ON public.module_access
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.id = module_access.team_member_id
    AND team_members.user_id = auth.uid()
));

-- RLS policies for audit_logs
CREATE POLICY "Owners can view their audit logs"
ON public.audit_logs
FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Function to get team member permissions
CREATE OR REPLACE FUNCTION public.get_team_member_permissions(_user_id UUID)
RETURNS TABLE (
    role permission_level,
    can_edit BOOLEAN,
    modules JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tm.role,
        tm.can_edit,
        COALESCE(
            jsonb_object_agg(ma.module_name, jsonb_build_object(
                'can_view', ma.can_view,
                'can_edit', ma.can_edit,
                'can_delete', ma.can_delete
            )),
            '{}'::jsonb
        ) as modules
    FROM public.team_members tm
    LEFT JOIN public.module_access ma ON ma.team_member_id = tm.id
    WHERE tm.user_id = _user_id AND tm.is_active = true
    GROUP BY tm.id, tm.role, tm.can_edit;
END;
$$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_team_members_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_team_members_updated_at();

CREATE TRIGGER update_module_access_updated_at
    BEFORE UPDATE ON public.module_access
    FOR EACH ROW
    EXECUTE FUNCTION public.update_team_members_updated_at();

-- Create indexes for performance
CREATE INDEX idx_team_members_owner_id ON public.team_members(owner_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_team_members_email ON public.team_members(email);
CREATE INDEX idx_module_access_team_member_id ON public.module_access(team_member_id);
CREATE INDEX idx_audit_logs_owner_id ON public.audit_logs(owner_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
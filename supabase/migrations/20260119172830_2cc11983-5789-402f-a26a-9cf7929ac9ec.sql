-- Add expiration and usage tracking to client_invitations
ALTER TABLE public.client_invitations
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
ADD COLUMN IF NOT EXISTS used_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS invite_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
ADD COLUMN IF NOT EXISTS inviter_business_name TEXT;

-- Update existing invitations to have expiration dates
UPDATE public.client_invitations 
SET expires_at = sent_at + interval '7 days'
WHERE expires_at IS NULL;

-- Add 'client' to app_role enum if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'client' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
        ALTER TYPE public.app_role ADD VALUE 'client';
    END IF;
END $$;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_client_invitations_token ON public.client_invitations(invite_token);
CREATE INDEX IF NOT EXISTS idx_client_invitations_email ON public.client_invitations(client_email);

-- Create function to validate invitation
CREATE OR REPLACE FUNCTION public.validate_client_invitation(p_token TEXT)
RETURNS TABLE (
    invitation_id UUID,
    client_name TEXT,
    client_email TEXT,
    firm_id TEXT,
    inviter_business_name TEXT,
    is_valid BOOLEAN,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_invitation RECORD;
BEGIN
    -- Get the invitation
    SELECT * INTO v_invitation
    FROM client_invitations ci
    WHERE ci.invite_token = p_token;
    
    -- Check if invitation exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            NULL::UUID,
            NULL::TEXT,
            NULL::TEXT,
            NULL::TEXT,
            NULL::TEXT,
            FALSE,
            'Invalid invitation link. Please request a new invitation.'::TEXT;
        RETURN;
    END IF;
    
    -- Check if already used
    IF v_invitation.used_at IS NOT NULL THEN
        RETURN QUERY SELECT 
            v_invitation.id,
            v_invitation.client_name,
            v_invitation.client_email,
            v_invitation.firm_id,
            v_invitation.inviter_business_name,
            FALSE,
            'This invitation has already been used. Please contact support if you need assistance.'::TEXT;
        RETURN;
    END IF;
    
    -- Check if expired
    IF v_invitation.expires_at < now() THEN
        RETURN QUERY SELECT 
            v_invitation.id,
            v_invitation.client_name,
            v_invitation.client_email,
            v_invitation.firm_id,
            v_invitation.inviter_business_name,
            FALSE,
            'This invitation has expired. Please request a new invitation.'::TEXT;
        RETURN;
    END IF;
    
    -- Check if status is not pending
    IF v_invitation.status != 'pending' THEN
        RETURN QUERY SELECT 
            v_invitation.id,
            v_invitation.client_name,
            v_invitation.client_email,
            v_invitation.firm_id,
            v_invitation.inviter_business_name,
            FALSE,
            'This invitation is no longer valid. Please request a new invitation.'::TEXT;
        RETURN;
    END IF;
    
    -- Valid invitation
    RETURN QUERY SELECT 
        v_invitation.id,
        v_invitation.client_name,
        v_invitation.client_email,
        v_invitation.firm_id,
        v_invitation.inviter_business_name,
        TRUE,
        NULL::TEXT;
END;
$$;

-- Create function to mark invitation as used
CREATE OR REPLACE FUNCTION public.mark_invitation_used(p_token TEXT, p_client_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE client_invitations
    SET 
        used_at = now(),
        client_user_id = p_client_user_id,
        status = 'accepted',
        responded_at = now(),
        updated_at = now()
    WHERE invite_token = p_token
    AND used_at IS NULL
    AND expires_at > now()
    AND status = 'pending';
    
    RETURN FOUND;
END;
$$;

-- Add RLS policies for the new functions
GRANT EXECUTE ON FUNCTION public.validate_client_invitation(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_invitation_used(TEXT, UUID) TO anon, authenticated;
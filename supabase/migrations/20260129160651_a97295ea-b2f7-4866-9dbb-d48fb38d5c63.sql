-- Create a secure public view for profiles that excludes sensitive PII
-- This prevents exposure of EIN, full addresses, and business phone numbers
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  full_name,
  avatar_url,
  business_name,
  created_at,
  updated_at,
  trial_ends_at
  -- Excludes: ein, email, business_phone, business_address, business_city, business_state, business_zip
FROM public.profiles;

-- Add comment explaining the security purpose
COMMENT ON VIEW public.profiles_public IS 'Secure view of profiles excluding sensitive PII (EIN, addresses, phone). Use this view for public-facing queries.';

-- Create an audit log trigger for profile access/modifications
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log updates to profiles for security monitoring
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (
      owner_id,
      user_id,
      action,
      entity_type,
      entity_id,
      details
    ) VALUES (
      NEW.id,
      auth.uid(),
      'profile_updated',
      'profile',
      NEW.id::text,
      jsonb_build_object(
        'fields_changed', (
          SELECT jsonb_object_agg(key, true)
          FROM jsonb_each(to_jsonb(NEW))
          WHERE to_jsonb(OLD) ->> key IS DISTINCT FROM to_jsonb(NEW) ->> key
        )
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for profile audit logging
DROP TRIGGER IF EXISTS audit_profile_changes ON public.profiles;
CREATE TRIGGER audit_profile_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_access();

-- Add a function to check if a user can view another user's profile
-- This enforces that users can only see their own profile data
CREATE OR REPLACE FUNCTION public.can_view_profile(_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    _profile_id = auth.uid() -- Users can only view their own profile
    OR public.has_app_role(auth.uid(), 'admin') -- Admins can view all profiles
$$;
-- Update the handle_new_user_app_role function to assign admin role to support@majrtaxsoftware.com
CREATE OR REPLACE FUNCTION public.handle_new_user_app_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if the user email is the admin email
  IF NEW.email = 'support@majrtaxsoftware.com' THEN
    INSERT INTO public.app_user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.app_user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$function$;

-- Also update any existing user with this email to have admin role
UPDATE public.app_user_roles 
SET role = 'admin' 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'support@majrtaxsoftware.com'
);

-- If the user exists but doesn't have a role entry, create one
INSERT INTO public.app_user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users 
WHERE email = 'support@majrtaxsoftware.com'
AND id NOT IN (SELECT user_id FROM public.app_user_roles);
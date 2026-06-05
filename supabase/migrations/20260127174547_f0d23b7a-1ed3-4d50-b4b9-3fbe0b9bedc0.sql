-- Update the handle_new_user_app_role function to check for client signups
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
  -- Check if this is a client signup (has is_client flag in metadata)
  ELSIF (NEW.raw_user_meta_data->>'is_client')::boolean = true THEN
    INSERT INTO public.app_user_roles (user_id, role)
    VALUES (NEW.id, 'client');
  ELSE
    INSERT INTO public.app_user_roles (user_id, role)
    VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$function$;
-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create app_user_roles table for authentication roles
CREATE TABLE public.app_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.app_user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_app_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.app_user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for app_user_roles
CREATE POLICY "Users can view their own roles"
ON public.app_user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.app_user_roles
FOR SELECT
USING (public.has_app_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.app_user_roles
FOR ALL
USING (public.has_app_role(auth.uid(), 'admin'));

-- Trigger to assign default 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_app_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.app_user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_app_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_app_role();
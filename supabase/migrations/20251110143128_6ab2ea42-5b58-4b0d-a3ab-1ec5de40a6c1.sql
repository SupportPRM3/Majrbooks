-- Create enum for role types
CREATE TYPE public.role_type AS ENUM ('client', 'firm');

-- Create user_roles table for storing custom roles
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role_name TEXT NOT NULL,
  description TEXT,
  role_type role_type NOT NULL DEFAULT 'client',
  permissions JSONB DEFAULT '{}',
  is_custom BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own roles"
  ON public.user_roles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own roles"
  ON public.user_roles FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Insert default roles
INSERT INTO public.user_roles (user_id, role_name, description, role_type, is_custom) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Bill approver', 'Users with this role can only approve bills. They can not approve bill payments, pay bills or take any other action related to bills or payments.', 'client', false),
  ('00000000-0000-0000-0000-000000000000', 'Bill clerk', 'Users with this role can add bills and mark bills as paid, but cannot approve or pay bills.', 'client', false),
  ('00000000-0000-0000-0000-000000000000', 'Bill payer', 'Users with this role can view and pay bills, and edit vendor info. They can not add bills, take any other action related to bills, or approve bill payments.', 'client', false),
  ('00000000-0000-0000-0000-000000000000', 'Company admin', 'Users with this role can see and do everything. This includes sending money, changing passwords, and adding users. Not everyone should be an admin.', 'client', false),
  ('00000000-0000-0000-0000-000000000000', 'Payroll manager', 'Users with this role can manage employees, run payroll, and do other payroll tasks.', 'client', false),
  ('00000000-0000-0000-0000-000000000000', 'Standard all access', 'Users with this role get full access without admin privileges, plus access to Payroll.', 'client', false),
  ('00000000-0000-0000-0000-000000000000', 'Standard all access (can''t pay bills)', 'Users with this role get full access without admin privileges, but cannot pay bills', 'client', false),
  ('00000000-0000-0000-0000-000000000000', 'Standard all access without payroll', 'Users with this role get full access without admin privileges.', 'client', false),
  ('00000000-0000-0000-0000-000000000000', 'Standard limited customers only', 'Users with this role can see and do everything with Customers and Sales.', 'client', false),
  ('00000000-0000-0000-0000-000000000000', 'Standard limited vendors only', 'Users with this role can see and do everything with Vendors and Purchases.', 'client', false),
  ('00000000-0000-0000-0000-000000000000', 'View company reports', 'Users with this role can see all reports except the ones that show payroll or contact info.', 'client', false);
-- Create client invitations table
CREATE TABLE public.client_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_email TEXT NOT NULL,
  client_name TEXT NOT NULL,
  firm_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own invitations"
ON public.client_invitations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own invitations"
ON public.client_invitations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invitations"
ON public.client_invitations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invitations"
ON public.client_invitations
FOR DELETE
USING (auth.uid() = user_id);
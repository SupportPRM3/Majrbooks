
CREATE TABLE public.schedule_c_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_name text NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  tax_year integer NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  transactions jsonb NOT NULL DEFAULT '[]'::jsonb,
  flagged_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  recurring_subscriptions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_confirmed boolean NOT NULL DEFAULT false,
  confirmed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.schedule_c_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own schedule c reports" ON public.schedule_c_reports FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own schedule c reports" ON public.schedule_c_reports FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can update own schedule c reports" ON public.schedule_c_reports FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedule c reports" ON public.schedule_c_reports FOR DELETE TO public USING (auth.uid() = user_id);

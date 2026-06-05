-- Create tax_returns table
CREATE TABLE public.tax_returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  deadline DATE NOT NULL,
  filing_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tax_returns ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own tax returns"
ON public.tax_returns FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tax returns"
ON public.tax_returns FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax returns"
ON public.tax_returns FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tax returns"
ON public.tax_returns FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_tax_returns_updated_at
BEFORE UPDATE ON public.tax_returns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create storage bucket for tax documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('tax-documents', 'tax-documents', false);

-- Create storage policies
CREATE POLICY "Users can view own tax documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'tax-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own tax documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'tax-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own tax documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'tax-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own tax documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'tax-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
-- Add review workflow fields to tax_returns table
ALTER TABLE public.tax_returns
ADD COLUMN review_status TEXT DEFAULT 'draft' CHECK (review_status IN ('draft', 'pending_review', 'approved', 'changes_requested')),
ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN review_notes TEXT,
ADD COLUMN client_notes TEXT,
ADD COLUMN sent_for_review_at TIMESTAMP WITH TIME ZONE;

-- Create a table for review history
CREATE TABLE public.tax_return_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_return_id UUID NOT NULL REFERENCES public.tax_returns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('sent_for_review', 'approved', 'requested_changes')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tax_return_reviews
ALTER TABLE public.tax_return_reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for tax_return_reviews
CREATE POLICY "Users can view reviews for their tax returns"
ON public.tax_return_reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tax_returns
    WHERE tax_returns.id = tax_return_reviews.tax_return_id
    AND tax_returns.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create reviews for their tax returns"
ON public.tax_return_reviews
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tax_returns
    WHERE tax_returns.id = tax_return_reviews.tax_return_id
    AND tax_returns.user_id = auth.uid()
  )
);
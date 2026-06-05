-- Create journal entries table
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_number TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  reference TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create journal entry lines table
CREATE TABLE public.journal_entry_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
  description TEXT,
  debit NUMERIC NOT NULL DEFAULT 0,
  credit NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;

-- RLS policies for journal_entries
CREATE POLICY "Users can view own journal entries"
  ON public.journal_entries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own journal entries"
  ON public.journal_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries"
  ON public.journal_entries
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries"
  ON public.journal_entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for journal_entry_lines
CREATE POLICY "Users can view own journal entry lines"
  ON public.journal_entry_lines
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.journal_entries
    WHERE journal_entries.id = journal_entry_lines.journal_entry_id
    AND journal_entries.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own journal entry lines"
  ON public.journal_entry_lines
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.journal_entries
    WHERE journal_entries.id = journal_entry_lines.journal_entry_id
    AND journal_entries.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own journal entry lines"
  ON public.journal_entry_lines
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.journal_entries
    WHERE journal_entries.id = journal_entry_lines.journal_entry_id
    AND journal_entries.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own journal entry lines"
  ON public.journal_entry_lines
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.journal_entries
    WHERE journal_entries.id = journal_entry_lines.journal_entry_id
    AND journal_entries.user_id = auth.uid()
  ));

-- Create trigger for updated_at
CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
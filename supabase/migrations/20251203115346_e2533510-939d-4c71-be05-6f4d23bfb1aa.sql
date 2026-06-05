-- Create client_subscriptions table
CREATE TABLE public.client_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  next_billing_date DATE NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_recommendations table
CREATE TABLE public.product_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'addon',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_recommendations table (tracks which clients received which product)
CREATE TABLE public.client_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  recommendation_id UUID REFERENCES public.product_recommendations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referrals table for revenue share
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  referred_client_name TEXT NOT NULL,
  referred_email TEXT,
  subscription_value NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 0.10,
  earnings NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  referred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payouts table
CREATE TABLE public.payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.client_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- RLS policies for client_subscriptions
CREATE POLICY "Users can view own client subscriptions" ON public.client_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own client subscriptions" ON public.client_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own client subscriptions" ON public.client_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own client subscriptions" ON public.client_subscriptions FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for product_recommendations
CREATE POLICY "Users can view own product recommendations" ON public.product_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own product recommendations" ON public.product_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own product recommendations" ON public.product_recommendations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own product recommendations" ON public.product_recommendations FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for client_recommendations
CREATE POLICY "Users can view own client recommendations" ON public.client_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own client recommendations" ON public.client_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own client recommendations" ON public.client_recommendations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own client recommendations" ON public.client_recommendations FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for referrals
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own referrals" ON public.referrals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own referrals" ON public.referrals FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for payouts
CREATE POLICY "Users can view own payouts" ON public.payouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own payouts" ON public.payouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payouts" ON public.payouts FOR UPDATE USING (auth.uid() = user_id);
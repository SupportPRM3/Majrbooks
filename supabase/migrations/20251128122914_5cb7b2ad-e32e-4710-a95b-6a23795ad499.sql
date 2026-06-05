-- Add payer information fields to profiles table for 1099 generation
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS ein TEXT,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS business_city TEXT,
ADD COLUMN IF NOT EXISTS business_state TEXT,
ADD COLUMN IF NOT EXISTS business_zip TEXT,
ADD COLUMN IF NOT EXISTS business_phone TEXT;
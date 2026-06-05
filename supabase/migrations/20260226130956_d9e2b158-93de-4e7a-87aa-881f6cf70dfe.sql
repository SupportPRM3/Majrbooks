
-- Create a view that masks the tax_id field for general contractor listing
-- Only shows last 4 characters of tax_id
CREATE OR REPLACE VIEW public.contractors_safe
WITH (security_invoker=on) AS
SELECT 
  id,
  first_name,
  last_name,
  business_name,
  CASE 
    WHEN tax_id IS NOT NULL AND length(tax_id) > 4 
    THEN '***-**-' || right(tax_id, 4)
    WHEN tax_id IS NOT NULL 
    THEN '***' || tax_id
    ELSE NULL
  END AS tax_id_masked,
  address,
  city,
  state,
  zip_code,
  email,
  phone,
  rate,
  payment_terms,
  status,
  user_id,
  created_at,
  updated_at
FROM public.contractors;

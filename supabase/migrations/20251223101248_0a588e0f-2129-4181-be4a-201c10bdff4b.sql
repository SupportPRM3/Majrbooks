-- Drop existing storage policies and create proper ones for receipts bucket
DROP POLICY IF EXISTS "Users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their receipts" ON storage.objects;

-- Create proper storage policies for receipts bucket
CREATE POLICY "Users can upload receipts"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their receipts"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their receipts"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their receipts"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'receipts' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
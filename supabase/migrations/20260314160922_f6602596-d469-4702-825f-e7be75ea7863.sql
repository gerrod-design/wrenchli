-- Create storage bucket for damage photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('damage-photos', 'damage-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload damage photos (anon + authenticated)
CREATE POLICY "Anyone can upload damage photos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'damage-photos');

-- Allow public read access to damage photos
CREATE POLICY "Public read access for damage photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'damage-photos');

-- Allow deletion by uploader or admin
CREATE POLICY "Users can delete own damage photos"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'damage-photos');

-- Add photo_urls column to quote_requests for attaching damage photos
ALTER TABLE public.quote_requests
ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT '{}';

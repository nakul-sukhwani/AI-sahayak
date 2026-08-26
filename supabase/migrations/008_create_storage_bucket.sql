-- Task 33: Supabase Storage — private complaints bucket
-- Run this in Supabase SQL Editor (or via Dashboard → Storage)
-- =====================================================================

-- Create the private bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'complaints',
  'complaints',
  false,                          -- private: no public URL
  524288,                         -- 512 KB limit at bucket level
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS Policies ──────────────────────────────────────────

-- Citizens can upload to their own folder: {userId}/{complaintId}/...
CREATE POLICY "citizens_upload_own_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'complaints'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Workers can upload proof images to their own folder
CREATE POLICY "workers_upload_proof"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'complaints'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- All authenticated users can read (signed URL required — bucket is private)
CREATE POLICY "authenticated_read_images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'complaints');

-- Users can delete only their own images
CREATE POLICY "users_delete_own_images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'complaints'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

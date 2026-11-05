-- ==============================================================================
-- Givi — Supabase Storage Buckets & Policies
-- ==============================================================================

-- Create receipts-and-proofs bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts-and-proofs', 'receipts-and-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public viewing of uploaded proof documents
CREATE POLICY "Public Access for Receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts-and-proofs');

-- Allow authenticated uploads of proof documents
CREATE POLICY "Authenticated Uploads for Receipts"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'receipts-and-proofs');


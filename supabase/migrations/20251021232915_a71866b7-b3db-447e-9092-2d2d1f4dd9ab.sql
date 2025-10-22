-- Create storage bucket for invoice photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('notes', 'notes', true);

-- Create RLS policies for storage bucket
CREATE POLICY "Users can view their own invoice photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own invoice photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own invoice photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own invoice photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'notes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public access to all photos in notes bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'notes');
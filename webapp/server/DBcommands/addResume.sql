-- Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes', 
  'resumes', 
  false, 
  10485760, -- 10MB
  ARRAY['application/pdf']::text[]
);

-- Create policies
CREATE POLICY "Service role can upload resumes"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Service role can read resumes"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'resumes');

CREATE POLICY "Service role can delete resumes"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'resumes');
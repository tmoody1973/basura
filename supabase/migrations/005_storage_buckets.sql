-- Create storage buckets for document uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'documents',
    'documents',
    false, -- Private bucket for security
    52428800, -- 50MB file size limit
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain', 'text/markdown']
  ),
  (
    'document-thumbnails',
    'document-thumbnails',
    true, -- Public bucket for thumbnails
    5242880, -- 5MB limit for thumbnails
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for documents bucket (private)
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.clerk_user_id = auth.jwt() ->> 'sub'
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.clerk_user_id = auth.jwt() ->> 'sub'
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.clerk_user_id = auth.jwt() ->> 'sub'
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.clerk_user_id = auth.jwt() ->> 'sub'
    AND profiles.role = 'admin'
  )
);

-- Storage policies for document-thumbnails bucket (public read)
CREATE POLICY "Anyone can view thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'document-thumbnails');

CREATE POLICY "Admins can upload thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'document-thumbnails' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.clerk_user_id = auth.jwt() ->> 'sub'
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'document-thumbnails' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.clerk_user_id = auth.jwt() ->> 'sub'
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can delete thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'document-thumbnails' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.clerk_user_id = auth.jwt() ->> 'sub'
    AND profiles.role = 'admin'
  )
);

-- Create function to generate unique file paths
CREATE OR REPLACE FUNCTION generate_document_path(
  user_id TEXT,
  original_filename TEXT,
  document_type TEXT DEFAULT 'budget'
)
RETURNS TEXT AS $$
DECLARE
  file_extension TEXT;
  timestamp_str TEXT;
  unique_id TEXT;
BEGIN
  -- Extract file extension
  file_extension := LOWER(SUBSTRING(original_filename FROM '\.([^.]+)$'));

  -- Generate timestamp string
  timestamp_str := TO_CHAR(NOW(), 'YYYY-MM-DD_HH24-MI-SS');

  -- Generate unique ID
  unique_id := SUBSTRING(gen_random_uuid()::TEXT FROM 1 FOR 8);

  -- Return structured path: user_id/document_type/timestamp_unique-id.extension
  RETURN FORMAT('%s/%s/%s_%s.%s',
    user_id,
    document_type,
    timestamp_str,
    unique_id,
    file_extension
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to validate file upload
CREATE OR REPLACE FUNCTION validate_document_upload(
  bucket_name TEXT,
  file_path TEXT,
  file_size BIGINT,
  mime_type TEXT
)
RETURNS JSONB AS $$
DECLARE
  bucket_config RECORD;
  is_valid BOOLEAN := TRUE;
  errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Get bucket configuration
  SELECT * INTO bucket_config
  FROM storage.buckets
  WHERE id = bucket_name;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'errors', ARRAY['Invalid bucket name']
    );
  END IF;

  -- Check file size
  IF file_size > bucket_config.file_size_limit THEN
    is_valid := FALSE;
    errors := array_append(errors,
      FORMAT('File size (%s bytes) exceeds limit (%s bytes)',
        file_size,
        bucket_config.file_size_limit
      )
    );
  END IF;

  -- Check MIME type
  IF bucket_config.allowed_mime_types IS NOT NULL
     AND NOT (mime_type = ANY(bucket_config.allowed_mime_types)) THEN
    is_valid := FALSE;
    errors := array_append(errors,
      FORMAT('MIME type "%s" not allowed. Allowed types: %s',
        mime_type,
        array_to_string(bucket_config.allowed_mime_types, ', ')
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'valid', is_valid,
    'errors', errors,
    'max_size', bucket_config.file_size_limit,
    'allowed_types', bucket_config.allowed_mime_types
  );
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT ALL ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.buckets TO anon, authenticated;
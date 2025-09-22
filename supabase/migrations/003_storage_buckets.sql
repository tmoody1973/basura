-- Storage buckets and policies for Budget Explorer

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('budget-documents', 'budget-documents', false, 52428800, ARRAY['application/pdf']), -- 50MB limit for PDFs
    ('generated-podcasts', 'generated-podcasts', false, 104857600, ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3']), -- 100MB limit for audio
    ('temp-uploads', 'temp-uploads', false, 52428800, ARRAY['application/pdf']) -- Temporary storage during processing
ON CONFLICT (id) DO NOTHING;

-- Helper function to get user ID from JWT
CREATE OR REPLACE FUNCTION get_user_id_from_jwt()
RETURNS TEXT AS $$
BEGIN
    RETURN auth.jwt() ->> 'sub';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage policies for budget-documents bucket
CREATE POLICY "Users can upload their own documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'budget-documents' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = get_user_id_from_jwt()
    );

CREATE POLICY "Users can view their own documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'budget-documents' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = get_user_id_from_jwt()
    );

CREATE POLICY "Users can update their own documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'budget-documents' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = get_user_id_from_jwt()
    );

CREATE POLICY "Users can delete their own documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'budget-documents' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = get_user_id_from_jwt()
    );

-- Storage policies for generated-podcasts bucket
CREATE POLICY "Users can upload their own podcasts" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'generated-podcasts' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = get_user_id_from_jwt()
    );

CREATE POLICY "Users can view their own podcasts" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'generated-podcasts' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = get_user_id_from_jwt()
    );

CREATE POLICY "Users can delete their own podcasts" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'generated-podcasts' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = get_user_id_from_jwt()
    );

-- Storage policies for temp-uploads bucket
CREATE POLICY "Users can upload to temp storage" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'temp-uploads' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = get_user_id_from_jwt()
    );

CREATE POLICY "Users can view their temp uploads" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'temp-uploads' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = get_user_id_from_jwt()
    );

CREATE POLICY "Users can delete their temp uploads" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'temp-uploads' AND
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = get_user_id_from_jwt()
    );

-- Function to cleanup old temp files (can be called by a cron job)
CREATE OR REPLACE FUNCTION cleanup_temp_uploads()
RETURNS void AS $$
BEGIN
    DELETE FROM storage.objects
    WHERE bucket_id = 'temp-uploads'
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
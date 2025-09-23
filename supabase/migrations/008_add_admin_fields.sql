-- Migration: 008_add_admin_fields.sql
-- Description: Add admin fields for document management and organization
-- Date: 2025-09-23

-- Create folders table for document organization
CREATE TABLE IF NOT EXISTS folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add admin fields to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_visible ON documents(is_visible);
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_folders_name ON folders(name);

-- Update existing documents to be visible by default
UPDATE documents SET is_visible = true WHERE is_visible IS NULL;

-- Enable Row Level Security (RLS) for folders
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for folders
CREATE POLICY "Allow all authenticated users to read folders" ON folders
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin users to manage folders" ON folders
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_user_id = auth.jwt() ->> 'sub'
      AND profiles.role = 'admin'
    )
  );

-- Update documents visibility policy to consider is_visible field
DROP POLICY IF EXISTS "Allow users to read all documents" ON documents;

CREATE POLICY "Allow users to read visible documents" ON documents
  FOR SELECT TO authenticated USING (
    is_visible = true OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.clerk_user_id = auth.jwt() ->> 'sub'
      AND profiles.role = 'admin'
    )
  );
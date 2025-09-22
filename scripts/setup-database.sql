-- Budget Explorer Database Setup Script
-- Run this in your Supabase SQL editor to set up the complete database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Execute all migrations in order
\i supabase/migrations/001_initial_schema.sql
\i supabase/migrations/002_rls_policies.sql
\i supabase/migrations/003_storage_buckets.sql
\i supabase/migrations/004_vector_search_functions.sql

-- Create sample data for testing (optional)
-- Insert a test profile
INSERT INTO profiles (clerk_user_id, email, full_name, user_type)
VALUES ('test_user_123', 'test@example.com', 'Test User', 'citizen')
ON CONFLICT (clerk_user_id) DO NOTHING;

-- You can also run individual migrations by copying and pasting each file's content
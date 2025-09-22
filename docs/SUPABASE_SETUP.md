# Supabase Setup Guide for Budget Explorer

## Overview
Budget Explorer uses Supabase for:
- **PostgreSQL database** with vector extensions for RAG
- **Storage buckets** for PDF documents and generated audio
- **Row Level Security** for user data isolation
- **Real-time subscriptions** for live chat updates

## Quick Setup

### 1. Database Configuration

Your Supabase project is already configured with:
- URL: `https://gtguvuhfhrrxggslzhqc.supabase.co`
- Database: `postgres.gtguvuhfhrrxggslzhqc`

### 2. Run Database Migrations

Copy and paste each migration file into your Supabase SQL Editor:

1. **001_initial_schema.sql** - Core tables (profiles, documents, conversations, etc.)
2. **002_rls_policies.sql** - Row Level Security policies
3. **003_storage_buckets.sql** - Storage buckets and policies
4. **004_vector_search_functions.sql** - Vector search functions

Or run the complete setup:
```sql
-- Copy the entire content of scripts/setup-database.sql
```

### 3. Storage Buckets

The following buckets will be created automatically:
- **budget-documents** (50MB limit) - PDF budget documents
- **generated-podcasts** (100MB limit) - Audio files
- **temp-uploads** (50MB limit) - Temporary processing

### 4. Required Extensions

Make sure these are enabled:
- `uuid-ossp` - UUID generation
- `vector` - Vector similarity search

### 5. Environment Variables

Update your `.env.local` with the database password:
```env
DATABASE_URL=postgresql://postgres.gtguvuhfhrrxggslzhqc:YOUR_DB_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

## Database Schema

### Core Tables

1. **profiles** - User profiles linked to Clerk
2. **documents** - Uploaded budget PDFs
3. **document_chunks** - Vector embeddings for RAG
4. **conversations** - Chat sessions
5. **messages** - Individual chat messages
6. **podcasts** - Generated audio content

### Key Features

- **Vector Search**: Full-text + semantic search across document chunks
- **Real-time**: Live chat updates and document processing status
- **Security**: RLS ensures users only see their own data
- **Performance**: Optimized indexes for fast queries

## Testing the Setup

1. Run the migrations in Supabase SQL Editor
2. Check that all tables are created
3. Verify storage buckets exist
4. Test the vector search functions

## Troubleshooting

### Common Issues

1. **Vector extension missing**: Enable in Database > Extensions
2. **RLS errors**: Check that policies are applied correctly
3. **Storage permissions**: Verify bucket policies are active
4. **Connection issues**: Ensure DATABASE_URL is correct

### Verification Queries

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Check vector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check storage buckets
SELECT * FROM storage.buckets;

-- Test vector search
SELECT * FROM match_document_chunks(
  'some-uuid'::uuid,
  array_fill(0.1, ARRAY[1536])::vector,
  0.5,
  5
);
```

## Next Steps

After setup:
1. ✅ Database and storage configured
2. 🔄 Add Clerk authentication
3. 🔄 Connect PDF processing pipeline
4. 🔄 Implement real-time chat features
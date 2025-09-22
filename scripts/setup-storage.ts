#!/usr/bin/env tsx

/**
 * Setup script to initialize Supabase storage buckets and policies
 * Run with: npm run setup:storage
 */

import { storageService } from '../lib/supabase/storage';
import { getSupabaseAdmin } from '../lib/supabase/client';

async function setupStorage() {
  console.log('🚀 Setting up Supabase storage buckets...\n');

  try {
    // Initialize storage buckets
    await storageService.initializeBuckets();
    console.log('✅ Storage buckets created successfully\n');

    // Setup storage policies via SQL
    const admin = getSupabaseAdmin();

    const policies = `
      -- Storage policies for documents bucket (private)
      CREATE POLICY IF NOT EXISTS "Users can view own documents"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );

      CREATE POLICY IF NOT EXISTS "Admins can view all documents"
      ON storage.objects FOR SELECT
      USING (
        bucket_id = 'documents' AND
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.clerk_user_id = auth.jwt() ->> 'sub'
          AND profiles.role = 'admin'
        )
      );

      CREATE POLICY IF NOT EXISTS "Admins can upload documents"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'documents' AND
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.clerk_user_id = auth.jwt() ->> 'sub'
          AND profiles.role = 'admin'
        )
      );

      CREATE POLICY IF NOT EXISTS "Admins can update documents"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'documents' AND
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.clerk_user_id = auth.jwt() ->> 'sub'
          AND profiles.role = 'admin'
        )
      );

      CREATE POLICY IF NOT EXISTS "Admins can delete documents"
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
      CREATE POLICY IF NOT EXISTS "Anyone can view thumbnails"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'document-thumbnails');

      CREATE POLICY IF NOT EXISTS "Admins can upload thumbnails"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'document-thumbnails' AND
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.clerk_user_id = auth.jwt() ->> 'sub'
          AND profiles.role = 'admin'
        )
      );

      CREATE POLICY IF NOT EXISTS "Admins can update thumbnails"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'document-thumbnails' AND
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.clerk_user_id = auth.jwt() ->> 'sub'
          AND profiles.role = 'admin'
        )
      );

      CREATE POLICY IF NOT EXISTS "Admins can delete thumbnails"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'document-thumbnails' AND
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.clerk_user_id = auth.jwt() ->> 'sub'
          AND profiles.role = 'admin'
        )
      );
    `;

    const { error: policyError } = await admin.rpc('exec_sql', { sql: policies });

    if (policyError) {
      console.warn('⚠️  Note: Storage policies may need to be set up manually in Supabase dashboard');
      console.log('Reason:', policyError.message);
    } else {
      console.log('✅ Storage policies created successfully');
    }

    console.log('\n📋 Storage Configuration Summary:');
    console.log('────────────────────────────────────');
    console.log('📁 Documents Bucket: documents (private)');
    console.log('   - Max file size: 50MB');
    console.log('   - Allowed types: PDF, DOCX, DOC, TXT, MD');
    console.log('   - Access: Admin upload, users view own documents');
    console.log('');
    console.log('🖼️  Thumbnails Bucket: document-thumbnails (public)');
    console.log('   - Max file size: 5MB');
    console.log('   - Allowed types: JPEG, PNG, WebP');
    console.log('   - Access: Public read, admin upload');
    console.log('');
    console.log('🔐 Security:');
    console.log('   - Role-based access control (RBAC)');
    console.log('   - Admin-only document uploads');
    console.log('   - User folder isolation');
    console.log('   - Signed URLs for private access');
    console.log('');
    console.log('✅ Storage setup complete! Ready for document uploads.');

  } catch (error) {
    console.error('❌ Storage setup failed:', error);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupStorage().catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

export { setupStorage };
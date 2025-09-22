# Document Upload System Testing Guide

This guide will help you test the complete document upload and processing system for the Budget Explorer application.

## Prerequisites

✅ **Before Testing, Ensure:**
1. Development server is running on port 3001: `npm run dev -- --port 3001`
2. All environment variables are configured in `.env.local`
3. Supabase storage buckets are set up (run the `005_storage_buckets.sql` migration)
4. You have an admin user account in the system

## Test Plan

### Phase 1: Basic System Health Check

#### 1.1 Environment Variables Check
Open your `.env.local` and verify these keys are present:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `LLAMAPARSE_API_KEY`
- ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- ✅ `CLERK_SECRET_KEY`

#### 1.2 Database Connection Test
1. Open Supabase dashboard
2. Check that these tables exist:
   - `documents`
   - `document_chunks`
   - `profiles`
3. Verify storage buckets exist:
   - `documents` (private)
   - `document-thumbnails` (public)

#### 1.3 Authentication Test
1. Visit: http://localhost:3001
2. Sign in with your admin account
3. Verify you see the upload interface (not the document library)

### Phase 2: API Endpoint Testing

#### 2.1 Test Document List API
```bash
# This should return 401 (unauthorized) for unauthenticated requests
curl -X GET http://localhost:3001/api/documents/upload

# Expected response: {"error":"Unauthorized - Authentication required"}
```

#### 2.2 Test Batch Processing Status
```bash
# This should also return 401
curl -X GET http://localhost:3001/api/documents/process-batch

# Expected response: {"error":"Unauthorized - Authentication required"}
```

### Phase 3: Manual Upload Testing

#### 3.1 Prepare Test Document
Create a simple test PDF or use this sample content and save as `test-budget.txt`:

```
CITY OF TESTVILLE
ANNUAL BUDGET DOCUMENT
FISCAL YEAR 2024

REVENUE SUMMARY
Property Tax Revenue: $5,250,000
Sales Tax Revenue: $2,100,000
Total Revenue: $7,350,000

EXPENDITURE SUMMARY
Police Department: $3,750,000
Fire Department: $2,850,000
Public Works: $1,900,000
Total Expenditures: $8,500,000
```

#### 3.2 Test File Upload via UI
1. Go to: http://localhost:3001
2. Sign in as admin user
3. You should see the upload interface
4. Select your test file
5. Fill in metadata:
   - Document Type: `budget`
   - Jurisdiction: `Test City`
   - Fiscal Year: `2024`
   - Description: `Test budget document`
6. Click upload
7. **Expected Result**: Success message with document ID

#### 3.3 Test File Upload via API (Alternative)
```bash
# Replace with your auth token from browser dev tools
curl -X POST http://localhost:3001/api/documents/upload \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -F "file=@test-budget.txt" \
  -F "documentType=budget" \
  -F "jurisdiction=Test City" \
  -F "fiscalYear=2024" \
  -F "description=Test budget document"
```

### Phase 4: Document Processing Testing

#### 4.1 Check Document in Database
1. Open Supabase dashboard → Table Editor → documents
2. Find your uploaded document
3. Verify fields:
   - `status` should be `uploaded`
   - `file_path` should have a value
   - `metadata` should contain upload info

#### 4.2 Test Document Processing
1. Note your document ID from the database
2. Test processing via API:

```bash
# Replace DOCUMENT_ID and AUTH_TOKEN
curl -X POST http://localhost:3001/api/documents/DOCUMENT_ID/process \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "document": {...},
  "processing": {
    "chunks_created": 5,
    "extracted_entities": 10,
    "tables_detected": 1,
    "processing_time": "2024-..."
  }
}
```

#### 4.3 Verify Processing Results
1. Check documents table - `status` should be `processed`
2. Check document_chunks table - should have new entries
3. Verify extracted metadata in the `metadata` field

### Phase 5: Storage Testing

#### 5.1 Check Supabase Storage
1. Go to Supabase dashboard → Storage
2. Navigate to `documents` bucket
3. You should see your uploaded file in a folder structure like:
   `user_id/budget/timestamp_uniqueid.txt`

#### 5.2 Test File Access
1. Get the document via API:
```bash
curl -X GET http://localhost:3001/api/documents/DOCUMENT_ID \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

2. **Expected**: Response with `downloadUrl` field
3. Visit the `downloadUrl` - should download your file

### Phase 6: Error Testing

#### 6.1 Test File Validation
1. Try uploading a file larger than 50MB
2. Try uploading an unsupported file type (.exe, .zip)
3. **Expected**: Proper error messages

#### 6.2 Test Non-Admin Access
1. Sign out and sign in as a regular user (not admin)
2. **Expected**: Should see document library, not upload interface
3. Try accessing upload API - should get 403 Forbidden

#### 6.3 Test Processing Errors
1. Try processing a document that's already processed
2. **Expected**: Error message about already processed

## Success Criteria

✅ **System is working correctly if:**

1. **Authentication**: Admin users see upload interface, regular users see library
2. **File Upload**: Files upload successfully and appear in database
3. **Storage**: Files are stored in correct Supabase bucket structure
4. **Processing**: LlamaParse processes documents and extracts text
5. **Chunking**: Document chunks are created in database
6. **Metadata**: Budget entities are extracted (amounts, departments, fiscal years)
7. **Error Handling**: Proper error messages for validation failures
8. **Security**: Non-admin users cannot upload documents

## Troubleshooting

### Common Issues

**"Authentication required" errors:**
- Check Clerk configuration
- Verify user has admin role in profiles table

**"LlamaParse processing failed":**
- Check LLAMAPARSE_API_KEY is valid
- Verify file is not corrupted

**"Failed to save document metadata":**
- Check database connection
- Verify all required columns exist

**"Storage upload failed":**
- Check Supabase storage configuration
- Verify bucket policies are set correctly

### Debug Commands

```bash
# Check if Next.js is running
curl http://localhost:3001/api/health

# Check Supabase connection (from your app)
# Add this temporarily to a page and visit it:
const { data, error } = await supabase.from('profiles').select('count');
console.log('DB Test:', { data, error });
```

## Next Steps After Testing

Once all tests pass:

1. **Upload Real Documents**: Try with actual government budget PDFs
2. **Test Vector Search**: Implement and test the search functionality
3. **Performance Testing**: Test with multiple large documents
4. **User Training**: Create documentation for end users
5. **Monitoring**: Set up logging and monitoring for production

---

## Quick Test Checklist

- [ ] Environment variables configured
- [ ] Database tables exist
- [ ] Storage buckets created
- [ ] Admin user can sign in
- [ ] Upload interface appears for admin
- [ ] Document uploads successfully
- [ ] File appears in storage
- [ ] Document processes with LlamaParse
- [ ] Chunks created in database
- [ ] Metadata extracted correctly
- [ ] Non-admin users see library only
- [ ] Error handling works properly
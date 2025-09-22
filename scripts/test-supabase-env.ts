#!/usr/bin/env tsx

import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

console.log('🔧 Checking Supabase Environment Variables...\n');

console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');

if (process.env.SUPABASE_URL) {
  console.log('\nSUPABASE_URL starts with:', process.env.SUPABASE_URL.substring(0, 20) + '...');
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('SUPABASE_SERVICE_ROLE_KEY starts with:', process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...');
}

console.log('\n📊 Environment Status:');
console.log('- Total env vars loaded:', Object.keys(process.env).length);
console.log('- Current working directory:', process.cwd());
console.log('- .env.local exists:', require('fs').existsSync('.env.local'));

// Test Supabase client creation
async function testSupabaseConnection() {
  try {
    const { createClient } = await import('@supabase/supabase-js');

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('✅ Supabase client created successfully');

    // Test basic connection
    const { data, error } = await supabase.from('documents').select('count').limit(1);

    if (error) {
      console.log('⚠️ Supabase connection test failed:', error.message);
    } else {
      console.log('✅ Supabase connection test passed');
    }

  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
  }
}

testSupabaseConnection();
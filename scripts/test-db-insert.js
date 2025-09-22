// Test database insert directly
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testInsert() {
  const testData = {
    document_id: 'test-doc-123',
    content: 'Test content for chunk',
    embedding: [0.1, 0.2, 0.3],
    chunk_index: 1,
    metadata: {
      jurisdiction_type: 'city',
      jurisdiction_name: 'test city',
    },
    page_number: null,
    section_title: null,
  };

  console.log('Attempting to insert test chunk...');
  console.log('Test data:', JSON.stringify(testData, null, 2));

  const { data, error } = await supabase
    .from('document_chunks')
    .insert([testData]);

  if (error) {
    console.error('Insert failed:', error.message);
    console.error('Error details:', error);
  } else {
    console.log('Insert successful:', data);
  }
}

testInsert().catch(console.error);
-- Vector search functions for RAG

-- Function to search document chunks using vector similarity
CREATE OR REPLACE FUNCTION match_document_chunks(
  input_document_id UUID,
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  page_number INTEGER,
  section_title TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.page_number,
    dc.section_title,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE dc.document_id = input_document_id
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to increment conversation message count
CREATE OR REPLACE FUNCTION increment_conversation_messages(conversation_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE conversations
  SET
    message_count = message_count + 1,
    last_message_at = NOW(),
    updated_at = NOW()
  WHERE id = conversation_id;
END;
$$;

-- Function to search across all user's documents
CREATE OR REPLACE FUNCTION search_user_documents(
  input_user_id UUID,
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  document_name TEXT,
  jurisdiction_type TEXT,
  content TEXT,
  page_number INTEGER,
  section_title TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    d.name AS document_name,
    d.jurisdiction_type,
    dc.content,
    dc.page_number,
    dc.section_title,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN documents d ON dc.document_id = d.id
  WHERE d.user_id = input_user_id
    AND d.processing_status = 'processed'
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
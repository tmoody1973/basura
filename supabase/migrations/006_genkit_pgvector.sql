-- Migration: 006_genkit_pgvector.sql
-- Description: Set up pgvector for Genkit-powered RAG system
-- Date: 2025-09-22

-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enhanced document_chunks table for Genkit
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-ada-002 dimensions
  metadata JSONB DEFAULT '{}',
  page_number INTEGER,
  section_title TEXT,
  chunk_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_metadata ON document_chunks USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_document_chunks_page_number ON document_chunks(page_number);
CREATE INDEX IF NOT EXISTS idx_document_chunks_chunk_index ON document_chunks(chunk_index);

-- Create vector similarity search index using IVFFlat
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create function for hybrid search (semantic + keyword)
CREATE OR REPLACE FUNCTION search_document_chunks(
  query_embedding vector(1536),
  target_document_id UUID,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  keyword_filter text DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content text,
  metadata jsonb,
  page_number integer,
  section_title text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.metadata,
    dc.page_number,
    dc.section_title,
    1 - (dc.embedding <=> query_embedding) as similarity
  FROM document_chunks dc
  WHERE
    dc.document_id = target_document_id
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    AND (
      keyword_filter IS NULL
      OR dc.content ILIKE '%' || keyword_filter || '%'
      OR dc.section_title ILIKE '%' || keyword_filter || '%'
    )
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create function for cross-document search
CREATE OR REPLACE FUNCTION search_all_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  jurisdiction_filter text DEFAULT NULL,
  fiscal_year_filter text DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content text,
  metadata jsonb,
  page_number integer,
  section_title text,
  similarity float,
  document_title text,
  jurisdiction_name text,
  jurisdiction_type text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.metadata,
    dc.page_number,
    dc.section_title,
    1 - (dc.embedding <=> query_embedding) as similarity,
    d.title as document_title,
    d.jurisdiction_name,
    d.jurisdiction_type
  FROM document_chunks dc
  JOIN documents d ON dc.document_id = d.id
  WHERE
    1 - (dc.embedding <=> query_embedding) > match_threshold
    AND (
      jurisdiction_filter IS NULL
      OR d.jurisdiction_name ILIKE '%' || jurisdiction_filter || '%'
      OR d.jurisdiction_type = jurisdiction_filter
    )
    AND (
      fiscal_year_filter IS NULL
      OR d.fiscal_year = fiscal_year_filter
    )
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create function for document statistics
CREATE OR REPLACE FUNCTION get_document_chunk_stats(doc_id UUID)
RETURNS TABLE (
  total_chunks integer,
  avg_chunk_length integer,
  total_pages integer,
  sections_count integer
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::integer as total_chunks,
    AVG(LENGTH(content))::integer as avg_chunk_length,
    MAX(page_number)::integer as total_pages,
    COUNT(DISTINCT section_title)::integer as sections_count
  FROM document_chunks
  WHERE document_id = doc_id;
END;
$$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_chunks_updated_at
  BEFORE UPDATE ON document_chunks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for document_chunks
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Allow users to read chunks from documents they have access to
CREATE POLICY "Users can read document chunks" ON document_chunks
  FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM documents
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to insert chunks for their documents
CREATE POLICY "Users can insert document chunks" ON document_chunks
  FOR INSERT
  WITH CHECK (
    document_id IN (
      SELECT id FROM documents
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to update chunks for their documents
CREATE POLICY "Users can update document chunks" ON document_chunks
  FOR UPDATE
  USING (
    document_id IN (
      SELECT id FROM documents
      WHERE user_id = auth.uid()
    )
  );

-- Allow users to delete chunks for their documents
CREATE POLICY "Users can delete document chunks" ON document_chunks
  FOR DELETE
  USING (
    document_id IN (
      SELECT id FROM documents
      WHERE user_id = auth.uid()
    )
  );

-- Create index for RLS performance
CREATE INDEX IF NOT EXISTS idx_document_chunks_user_access ON document_chunks(document_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON document_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION search_document_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION search_all_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION get_document_chunk_stats TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE document_chunks IS 'Stores document chunks with embeddings for Genkit-powered RAG system';
COMMENT ON FUNCTION search_document_chunks IS 'Performs semantic similarity search within a specific document';
COMMENT ON FUNCTION search_all_chunks IS 'Performs semantic similarity search across all accessible documents';
COMMENT ON FUNCTION get_document_chunk_stats IS 'Returns statistics about document chunks for a given document';
// Core document processing types
export interface DocumentProcessingResult {
  id: string;
  text: string;
  metadata: DocumentMetadata;
  chunks: DocumentChunk[];
}

export interface DocumentMetadata {
  filename: string;
  pageCount: number;
  fileSize: number;
  processedAt: string;
  mimeType?: string;
  language?: string;
  extractedEntities?: ExtractedEntity[];
}

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: ChunkMetadata;
  embedding?: number[]; // For vector storage
}

export interface ChunkMetadata {
  pageNumber: number;
  sectionTitle?: string;
  chunkIndex: number;
  wordCount?: number;
  hasNumbers?: boolean; // Budget documents often contain numerical data
  hasTables?: boolean;
}

// Budget-specific types
export interface ExtractedEntity {
  type: EntityType;
  value: string;
  confidence: number;
  position: {
    start: number;
    end: number;
  };
}

export type EntityType =
  | 'BUDGET_AMOUNT'
  | 'DEPARTMENT'
  | 'PROGRAM'
  | 'FISCAL_YEAR'
  | 'REVENUE_SOURCE'
  | 'EXPENDITURE_CATEGORY'
  | 'DATE'
  | 'PERCENTAGE';

// LlamaParse configuration types
export interface LlamaParseConfig {
  apiKey: string;
  resultType: 'text' | 'markdown';
  verbose: boolean;
  language: string;
  parsingInstruction?: string;
  skipDiagonalText?: boolean;
  invalidateCache?: boolean;
  doNotCache?: boolean;
  fastMode?: boolean;
}

export interface ProcessingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  extractEntities?: boolean;
  generateSummary?: boolean;
  detectTables?: boolean;
}

// API response types
export interface ProcessingStatus {
  id: string;
  status: ProcessingStatusType;
  progress: number;
  message?: string;
  startedAt: string;
  completedAt?: string;
  error?: ProcessingErrorInfo;
}

export type ProcessingStatusType =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ProcessingErrorInfo {
  code: string;
  message: string;
  details?: Record<string, any>;
  retryable: boolean;
}

// File validation types
export interface FileValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  fileInfo: {
    name: string;
    size: number;
    type: string;
    extension: string;
  };
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  suggestion?: string;
}

// Storage and database types
export interface StoredDocument {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  status: DocumentStatus;
  processingResult?: DocumentProcessingResult;
  uploadedAt: string;
  processedAt?: string;
  error?: string;
  metadata: {
    jurisdiction?: string;
    fiscalYear?: string;
    documentType?: string;
    description?: string;
  };
}

export type DocumentStatus =
  | 'uploaded'
  | 'processing'
  | 'processed'
  | 'failed'
  | 'deleted';

export interface DocumentChunkStored {
  id: string;
  documentId: string;
  content: string;
  metadata: ChunkMetadata;
  embedding: number[];
  createdAt: string;
}

// Search and retrieval types
export interface SearchQuery {
  query: string;
  documentId?: string;
  jurisdiction?: string;
  fiscalYear?: string;
  limit?: number;
  threshold?: number;
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
  document: {
    id: string;
    filename: string;
    metadata: Record<string, any>;
  };
}

// Vector database types
export interface VectorSearchParams {
  embedding: number[];
  topK: number;
  filter?: Record<string, any>;
  namespace?: string;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: Record<string, any>;
  content?: string;
}

// Analytics and metrics types
export interface ProcessingMetrics {
  totalDocuments: number;
  totalChunks: number;
  averageProcessingTime: number;
  successRate: number;
  commonErrors: Array<{
    error: string;
    count: number;
  }>;
  dailyStats: Array<{
    date: string;
    documentsProcessed: number;
    averageFileSize: number;
  }>;
}

export interface DocumentAnalytics {
  documentId: string;
  views: number;
  searches: number;
  downloads: number;
  lastAccessed: string;
  popularQueries: Array<{
    query: string;
    count: number;
  }>;
}

// Utility types
export type FileType = 'pdf' | 'docx' | 'doc' | 'txt' | 'md';

export interface SupportedFileTypes {
  [key: string]: {
    extensions: string[];
    maxSize: number;
    description: string;
    priority: number;
  };
}

// Event types for webhooks/notifications
export interface DocumentEvent {
  type: DocumentEventType;
  documentId: string;
  userId: string;
  timestamp: string;
  data: Record<string, any>;
}

export type DocumentEventType =
  | 'document.uploaded'
  | 'document.processing.started'
  | 'document.processing.completed'
  | 'document.processing.failed'
  | 'document.deleted'
  | 'document.searched'
  | 'document.downloaded';

// Export all error types from errors module
export * from './errors';
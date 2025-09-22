// Main LlamaParse service exports
export { llamaParseService } from './client';

// Import types for utility functions
import type { FileType, SupportedFileTypes } from './types';

// Type exports
export type {
  DocumentProcessingResult,
  DocumentChunk,
  DocumentMetadata,
  ChunkMetadata,
  ProcessingOptions,
  LlamaParseConfig,
  ProcessingStatus,
  ProcessingStatusType,
  ProcessingErrorInfo,
  FileValidation,
  ValidationError as FileValidationError,
  ValidationWarning,
  StoredDocument,
  DocumentStatus,
  DocumentChunkStored,
  SearchQuery,
  SearchResult,
  VectorSearchParams,
  VectorSearchResult,
  ProcessingMetrics,
  DocumentAnalytics,
  DocumentEvent,
  DocumentEventType,
  FileType,
  SupportedFileTypes,
  ExtractedEntity,
  EntityType
} from './types';

// Error exports
export {
  LlamaParseError,
  RateLimitError,
  AuthenticationError,
  FileSizeError,
  ValidationError,
  handleLlamaParseError,
  withRetry,
  DEFAULT_RETRY_CONFIG
} from './errors';

// Supported file types configuration
export const SUPPORTED_FILE_TYPES: SupportedFileTypes = {
  pdf: {
    extensions: ['.pdf'],
    maxSize: 25 * 1024 * 1024, // 25MB
    description: 'PDF documents',
    priority: 1
  },
  docx: {
    extensions: ['.docx'],
    maxSize: 25 * 1024 * 1024, // 25MB
    description: 'Microsoft Word documents (DOCX)',
    priority: 2
  },
  doc: {
    extensions: ['.doc'],
    maxSize: 25 * 1024 * 1024, // 25MB
    description: 'Microsoft Word documents (DOC)',
    priority: 3
  },
  txt: {
    extensions: ['.txt'],
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'Plain text files',
    priority: 4
  },
  md: {
    extensions: ['.md', '.markdown'],
    maxSize: 10 * 1024 * 1024, // 10MB
    description: 'Markdown files',
    priority: 5
  }
} as const;

// Utility functions
export const getFileType = (filename: string): FileType | null => {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));

  for (const [type, config] of Object.entries(SUPPORTED_FILE_TYPES)) {
    if (config.extensions.includes(extension)) {
      return type as FileType;
    }
  }

  return null;
};

export const isFileSupported = (filename: string): boolean => {
  return getFileType(filename) !== null;
};

export const getMaxFileSize = (filename: string): number => {
  const fileType = getFileType(filename);
  if (!fileType) return 0;

  return SUPPORTED_FILE_TYPES[fileType].maxSize;
};

export const validateFileName = (filename: string): {
  isValid: boolean;
  error?: string;
} => {
  if (!filename || filename.trim() === '') {
    return { isValid: false, error: 'Filename is required' };
  }

  if (filename.length > 255) {
    return { isValid: false, error: 'Filename is too long (max 255 characters)' };
  }

  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(filename)) {
    return { isValid: false, error: 'Filename contains invalid characters' };
  }

  if (!isFileSupported(filename)) {
    const supportedExts = Object.values(SUPPORTED_FILE_TYPES)
      .flatMap(config => config.extensions)
      .join(', ');
    return {
      isValid: false,
      error: `Unsupported file type. Supported extensions: ${supportedExts}`
    };
  }

  return { isValid: true };
};
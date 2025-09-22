export class LlamaParseError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'LlamaParseError';
  }
}

export class RateLimitError extends LlamaParseError {
  constructor(
    message: string = 'Rate limit exceeded',
    public resetTime?: Date
  ) {
    super(message, 'RATE_LIMIT', 429, true);
  }
}

export class AuthenticationError extends LlamaParseError {
  constructor(message: string = 'Invalid API key') {
    super(message, 'AUTH_ERROR', 401, false);
  }
}

export class FileSizeError extends LlamaParseError {
  constructor(message: string = 'File size exceeds limit') {
    super(message, 'FILE_SIZE_ERROR', 413, false);
  }
}

export class ProcessingError extends LlamaParseError {
  constructor(message: string = 'Document processing failed') {
    super(message, 'PROCESSING_ERROR', 500, true);
  }
}

export class ValidationError extends LlamaParseError {
  constructor(message: string = 'Invalid file format') {
    super(message, 'VALIDATION_ERROR', 400, false);
  }
}

export function handleLlamaParseError(error: any): LlamaParseError {
  // Handle common HTTP status codes
  if (error.response?.status) {
    switch (error.response.status) {
      case 401:
        return new AuthenticationError(
          error.response.data?.message || 'Invalid API key'
        );
      case 429:
        const resetTime = error.response.headers?.['x-ratelimit-reset']
          ? new Date(parseInt(error.response.headers['x-ratelimit-reset']) * 1000)
          : undefined;
        return new RateLimitError(
          error.response.data?.message || 'Rate limit exceeded',
          resetTime
        );
      case 413:
        return new FileSizeError(
          error.response.data?.message || 'File size exceeds limit'
        );
      case 400:
        return new ValidationError(
          error.response.data?.message || 'Invalid file format'
        );
      default:
        return new ProcessingError(
          error.response.data?.message || 'Document processing failed'
        );
    }
  }

  // Handle network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return new ProcessingError('Network connection failed');
  }

  // Handle known error messages
  const errorMessage = error.message || error.toString();

  if (errorMessage.includes('API key')) {
    return new AuthenticationError(errorMessage);
  }

  if (errorMessage.includes('rate limit')) {
    return new RateLimitError(errorMessage);
  }

  if (errorMessage.includes('file size') || errorMessage.includes('too large')) {
    return new FileSizeError(errorMessage);
  }

  if (errorMessage.includes('invalid format') || errorMessage.includes('unsupported')) {
    return new ValidationError(errorMessage);
  }

  // Default to processing error
  return new ProcessingError(errorMessage);
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: LlamaParseError;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = handleLlamaParseError(error);

      // Don't retry for non-retryable errors
      if (!lastError.retryable || attempt === config.maxAttempts) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      );

      console.warn(
        `LlamaParse attempt ${attempt} failed: ${lastError.message}. Retrying in ${delay}ms...`
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
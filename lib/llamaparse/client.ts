import {
  handleLlamaParseError,
  withRetry,
  DEFAULT_RETRY_CONFIG,
  ValidationError,
  FileSizeError
} from './errors';
import type {
  DocumentProcessingResult,
  DocumentChunk,
  ProcessingOptions,
  LlamaParseConfig,
  FileType
} from './types';

class LlamaParseService {
  private apiKey: string;
  private baseUrl: string = 'https://api.cloud.llamaindex.ai/api/v1/parsing';

  constructor() {
    this.apiKey = process.env.LLAMAPARSE_API_KEY || '';

    if (!this.apiKey) {
      console.warn('⚠️ LLAMAPARSE_API_KEY not found in environment variables');
    }
  }

  async processDocument(
    file: File | Buffer,
    filename: string,
    options?: ProcessingOptions
  ): Promise<DocumentProcessingResult> {
    // Check if API key is configured
    const currentApiKey = this.apiKey || process.env.LLAMAPARSE_API_KEY || '';
    if (!currentApiKey) {
      throw new Error('LLAMAPARSE_API_KEY is not configured. Please add it to your .env.local file.');
    }
    this.apiKey = currentApiKey; // Update instance variable

    // Validate file
    this.validateFile(file, filename);

    return withRetry(async () => {
      console.log(`🚀 [LlamaParse] Starting processing for: ${filename}`);
      console.log(`📊 [LlamaParse] File size: ${file instanceof File ? file.size : file.length} bytes`);

      // Convert File to Buffer if needed
      let buffer: Buffer;
      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else {
        buffer = file;
      }

      try {
        // Upload file and start processing
        console.log(`📤 [LlamaParse] Uploading file to LlamaParse API...`);
        const jobId = await this.uploadFile(buffer, filename);
        console.log(`✅ [LlamaParse] Job created with ID: ${jobId}`);
        console.log(`⏳ [LlamaParse] Processing with mode: parse_page_with_agent`);

        // Poll for completion
        const result = await this.pollJobCompletion(jobId);

        if (!result || !result.text) {
          console.error(`❌ [LlamaParse] No content extracted from document`);
          throw new Error('No content extracted from document');
        }

        // Get the extracted text
        const fullText = result.text;

        console.log(`✅ [LlamaParse] Successfully extracted ${fullText.length} characters`);
        console.log(`📄 [LlamaParse] Document has ${result.pages} pages`);
        console.log(`🔍 [LlamaParse] Text preview (first 200 chars):`);
        console.log(fullText.substring(0, 200) + '...');

        // Create chunks from the processed text
        const chunks = this.createChunks(fullText, {
          chunkSize: options?.chunkSize || 1000,
          chunkOverlap: options?.chunkOverlap || 200,
        });

        const processedResult: DocumentProcessingResult = {
          id: this.generateId(),
          text: fullText,
          metadata: {
            filename,
            pageCount: result.pages || 1,
            fileSize: buffer.length,
            processedAt: new Date().toISOString(),
          },
          chunks,
        };

        console.log(`📦 [LlamaParse] Created ${chunks.length} chunks with size ${options?.chunkSize || 1000} and overlap ${options?.chunkOverlap || 200}`);
        console.log(`✨ [LlamaParse] Processing complete for ${filename}`);
        return processedResult;

      } catch (error) {
        console.error('❌ [LlamaParse] Processing failed:', error);
        console.error('🔍 [LlamaParse] Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        throw handleLlamaParseError(error);
      }
    }, DEFAULT_RETRY_CONFIG);
  }

  private async uploadFile(buffer: Buffer, filename: string): Promise<string> {
    const formData = new FormData();

    // Create a File-like object from Buffer
    const blob = new Blob([new Uint8Array(buffer)], { type: 'application/octet-stream' });
    formData.append('file', blob, filename);

    // LlamaParse configuration
    formData.append('parse_mode', 'parse_page_with_agent');
    formData.append('result_type', 'text');
    formData.append('verbose', 'true');
    formData.append('language', 'en');
    formData.append('target_pages', '');
    formData.append('invalidate_cache', 'false');
    formData.append('do_not_cache', 'false');
    formData.append('fast_mode', 'false');
    formData.append('gpt4o_mode', 'false');
    formData.append('bounding_box', '');
    formData.append('webhook_url', '');
    formData.append('parsing_instruction', 'Extract budget data, department names, and financial figures from this government budget document.');

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LlamaParse upload failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.id; // Job ID
  }

  private async pollJobCompletion(jobId: string): Promise<{ text: string; pages: number }> {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    console.log(`⏳ [LlamaParse] Starting to poll job ${jobId} for completion...`);

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${this.baseUrl}/job/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Job status check failed (${response.status}): ${await response.text()}`);
        }

        const data = await response.json();
        console.log(`🔄 [LlamaParse] Job ${jobId} status: ${data.status} (attempt ${attempts + 1}/${maxAttempts})`);

        if (data.status === 'SUCCESS') {
          console.log(`✅ [LlamaParse] Job ${jobId} completed successfully!`);
          // Get the result
          const resultResponse = await fetch(`${this.baseUrl}/job/${jobId}/result/text`, {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
            },
          });

          if (!resultResponse.ok) {
            throw new Error(`Failed to get result (${resultResponse.status}): ${await resultResponse.text()}`);
          }

          const resultText = await resultResponse.text();

          // Check if the result is JSON-wrapped
          let parsedText = resultText;
          try {
            const jsonResult = JSON.parse(resultText);
            if (jsonResult.text) {
              parsedText = jsonResult.text;
            }
          } catch {
            // If it's not JSON, use the text as-is
            parsedText = resultText;
          }

          return {
            text: parsedText,
            pages: data.pages || 1,
          };
        } else if (data.status === 'ERROR') {
          throw new Error(`Processing failed: ${data.error || 'Unknown error'}`);
        }

        // Job still processing, wait and retry
        console.log(`⏳ [LlamaParse] Job still processing, waiting 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;

      } catch (error) {
        console.error(`⚠️ [LlamaParse] Error checking job status (attempt ${attempts + 1}):`, error);
        if (attempts === maxAttempts - 1) {
          throw error;
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }
    }

    throw new Error(`Job ${jobId} did not complete within timeout period`);
  }

  private validateFile(file: File | Buffer, filename: string): void {
    // Check file extension
    const validExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md'];
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));

    if (!validExtensions.includes(extension)) {
      throw new ValidationError(
        `Unsupported file format: ${extension}. Supported formats: ${validExtensions.join(', ')}`
      );
    }

    // Check file size (25MB limit for LlamaParse)
    const maxSize = 25 * 1024 * 1024; // 25MB
    let fileSize: number;

    if (file instanceof File) {
      fileSize = file.size;
    } else {
      fileSize = file.length;
    }

    if (fileSize > maxSize) {
      throw new FileSizeError(
        `File size (${Math.round(fileSize / 1024 / 1024)}MB) exceeds the maximum allowed size of 25MB`
      );
    }

    if (fileSize === 0) {
      throw new ValidationError('File is empty');
    }
  }

  private createChunks(
    text: string,
    options: { chunkSize: number; chunkOverlap: number }
  ): DocumentChunk[] {
    const { chunkSize, chunkOverlap } = options;
    const chunks: DocumentChunk[] = [];

    // Split by paragraphs first, then by sentences if needed
    const paragraphs = text.split(/\n\s*\n/);
    let currentChunk = '';
    let chunkIndex = 0;
    let currentPageNumber = 1;

    for (const paragraph of paragraphs) {
      // Check if adding this paragraph would exceed chunk size
      if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
        // Create chunk from current content
        chunks.push({
          id: this.generateId(),
          content: currentChunk.trim(),
          metadata: {
            pageNumber: currentPageNumber,
            chunkIndex: chunkIndex++,
          },
        });

        // Start new chunk with overlap
        const overlapText = this.getOverlapText(currentChunk, chunkOverlap);
        currentChunk = overlapText + paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }

      // Estimate page number based on content length (rough approximation)
      currentPageNumber = Math.ceil(chunks.length / 2) + 1;
    }

    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push({
        id: this.generateId(),
        content: currentChunk.trim(),
        metadata: {
          pageNumber: currentPageNumber,
          chunkIndex: chunkIndex,
        },
      });
    }

    return chunks;
  }

  private getOverlapText(text: string, overlapSize: number): string {
    if (text.length <= overlapSize) return text;

    // Try to break at sentence boundaries for better overlap
    const sentences = text.split(/[.!?]+/);
    let overlap = '';
    let totalLength = 0;

    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentence = sentences[i].trim();
      if (totalLength + sentence.length > overlapSize) break;

      overlap = sentence + '. ' + overlap;
      totalLength += sentence.length;
    }

    return overlap || text.slice(-overlapSize);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const currentApiKey = this.apiKey || process.env.LLAMAPARSE_API_KEY || '';

      if (!currentApiKey) {
        console.error('No API key available for validation');
        return false;
      }

      // Test API key with a simple request to get job list
      const response = await fetch(`${this.baseUrl.replace('/parsing', '')}/jobs`, {
        headers: {
          'Authorization': `Bearer ${currentApiKey}`,
        },
      });

      // If we get a response (even if empty), the API key is valid
      return response.status === 200 || response.status === 404; // 404 is fine for empty job list
    } catch (error) {
      console.error('LlamaParse API key validation failed:', error);
      return false;
    }
  }

  getUsageInfo(): { apiKey: string; configured: boolean } {
    const currentApiKey = this.apiKey || process.env.LLAMAPARSE_API_KEY || '';
    return {
      apiKey: currentApiKey ? currentApiKey.slice(0, 8) + '...' : 'Not configured',
      configured: !!currentApiKey,
    };
  }
}

// Export singleton instance
export const llamaParseService = new LlamaParseService();

// Export types
export type { DocumentProcessingResult, DocumentChunk };
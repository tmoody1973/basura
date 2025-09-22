import { getSupabaseAdmin } from './client';

export interface UploadResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  maxSize?: number;
  allowedTypes?: string[];
}

class SupabaseStorageService {
  private admin = getSupabaseAdmin();

  // Storage bucket configurations
  static readonly BUCKETS = {
    DOCUMENTS: 'documents',
    THUMBNAILS: 'document-thumbnails'
  } as const;

  static readonly LIMITS = {
    DOCUMENT_MAX_SIZE: 50 * 1024 * 1024, // 50MB
    THUMBNAIL_MAX_SIZE: 5 * 1024 * 1024,  // 5MB
  } as const;

  static readonly ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'text/plain', // .txt
    'text/markdown' // .md
  ] as const;

  static readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ] as const;

  /**
   * Initialize storage buckets with proper configuration
   */
  async initializeBuckets(): Promise<void> {
    try {
      // Check if buckets exist
      const { data: buckets, error: listError } = await this.admin.storage.listBuckets();

      if (listError) {
        console.error('Error listing buckets:', listError);
        throw listError;
      }

      const existingBuckets = buckets?.map(b => b.id) || [];

      // Create documents bucket if it doesn't exist
      if (!existingBuckets.includes(SupabaseStorageService.BUCKETS.DOCUMENTS)) {
        const { error: createError } = await this.admin.storage.createBucket(
          SupabaseStorageService.BUCKETS.DOCUMENTS,
          {
            public: false,
            fileSizeLimit: SupabaseStorageService.LIMITS.DOCUMENT_MAX_SIZE,
            allowedMimeTypes: [...SupabaseStorageService.ALLOWED_DOCUMENT_TYPES]
          }
        );

        if (createError) {
          console.error('Error creating documents bucket:', createError);
          throw createError;
        }
      }

      // Create thumbnails bucket if it doesn't exist
      if (!existingBuckets.includes(SupabaseStorageService.BUCKETS.THUMBNAILS)) {
        const { error: createError } = await this.admin.storage.createBucket(
          SupabaseStorageService.BUCKETS.THUMBNAILS,
          {
            public: true,
            fileSizeLimit: SupabaseStorageService.LIMITS.THUMBNAIL_MAX_SIZE,
            allowedMimeTypes: [...SupabaseStorageService.ALLOWED_IMAGE_TYPES]
          }
        );

        if (createError) {
          console.error('Error creating thumbnails bucket:', createError);
          throw createError;
        }
      }

      console.log('Storage buckets initialized successfully');
    } catch (error) {
      console.error('Failed to initialize storage buckets:', error);
      throw error;
    }
  }

  /**
   * Generate a unique file path for document storage
   */
  generateDocumentPath(
    userId: string,
    originalFilename: string,
    documentType: string = 'budget'
  ): string {
    const extension = originalFilename.toLowerCase().split('.').pop() || 'pdf';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueId = Math.random().toString(36).substring(2, 10);

    return `${userId}/${documentType}/${timestamp}_${uniqueId}.${extension}`;
  }

  /**
   * Validate file before upload
   */
  validateFile(
    file: File,
    bucketType: 'documents' | 'thumbnails' = 'documents'
  ): ValidationResult {
    const errors: string[] = [];

    // Determine limits based on bucket type
    const maxSize = bucketType === 'documents'
      ? SupabaseStorageService.LIMITS.DOCUMENT_MAX_SIZE
      : SupabaseStorageService.LIMITS.THUMBNAIL_MAX_SIZE;

    const allowedTypes = bucketType === 'documents'
      ? SupabaseStorageService.ALLOWED_DOCUMENT_TYPES
      : SupabaseStorageService.ALLOWED_IMAGE_TYPES;

    // Check file size
    if (file.size > maxSize) {
      errors.push(
        `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(maxSize / 1024 / 1024)}MB)`
      );
    }

    // Check file type
    if (!(allowedTypes as readonly string[]).includes(file.type)) {
      errors.push(
        `File type "${file.type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      );
    }

    // Check for empty file
    if (file.size === 0) {
      errors.push('File is empty');
    }

    return {
      valid: errors.length === 0,
      errors,
      maxSize,
      allowedTypes: [...allowedTypes]
    };
  }

  /**
   * Upload a document file
   */
  async uploadDocument(
    file: File,
    userId: string,
    options?: {
      documentType?: string;
      customPath?: string;
    }
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file, 'documents');
      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Generate file path
      const filePath = options?.customPath ||
        this.generateDocumentPath(userId, file.name, options?.documentType);

      // Upload file
      const { data, error } = await this.admin.storage
        .from(SupabaseStorageService.BUCKETS.DOCUMENTS)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Get signed URL for private access
      const { data: urlData } = await this.admin.storage
        .from(SupabaseStorageService.BUCKETS.DOCUMENTS)
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      return {
        success: true,
        path: data.path,
        url: urlData?.signedUrl
      };

    } catch (error) {
      console.error('Document upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload a thumbnail image
   */
  async uploadThumbnail(
    file: File,
    documentId: string,
    userId: string
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file, 'thumbnails');
      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Generate thumbnail path
      const extension = file.name.split('.').pop() || 'jpg';
      const filePath = `${userId}/${documentId}_thumbnail.${extension}`;

      // Upload file
      const { data, error } = await this.admin.storage
        .from(SupabaseStorageService.BUCKETS.THUMBNAILS)
        .upload(filePath, file, {
          cacheControl: '86400', // 24 hours
          upsert: true
        });

      if (error) {
        console.error('Thumbnail upload error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Get public URL
      const { data: urlData } = this.admin.storage
        .from(SupabaseStorageService.BUCKETS.THUMBNAILS)
        .getPublicUrl(filePath);

      return {
        success: true,
        path: data.path,
        url: urlData.publicUrl
      };

    } catch (error) {
      console.error('Thumbnail upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Get signed URL for document access
   */
  async getDocumentUrl(filePath: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data, error } = await this.admin.storage
        .from(SupabaseStorageService.BUCKETS.DOCUMENTS)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Failed to get document URL:', error);
      return null;
    }
  }

  /**
   * Delete a document file
   */
  async deleteDocument(filePath: string): Promise<boolean> {
    try {
      const { error } = await this.admin.storage
        .from(SupabaseStorageService.BUCKETS.DOCUMENTS)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting document:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete document:', error);
      return false;
    }
  }

  /**
   * Delete a thumbnail file
   */
  async deleteThumbnail(filePath: string): Promise<boolean> {
    try {
      const { error } = await this.admin.storage
        .from(SupabaseStorageService.BUCKETS.THUMBNAILS)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting thumbnail:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete thumbnail:', error);
      return false;
    }
  }

  /**
   * List documents for a user
   */
  async listUserDocuments(userId: string): Promise<any[]> {
    try {
      const { data, error } = await this.admin.storage
        .from(SupabaseStorageService.BUCKETS.DOCUMENTS)
        .list(userId, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Error listing documents:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Failed to list documents:', error);
      return [];
    }
  }
}

// Export singleton instance
export const storageService = new SupabaseStorageService();

// Export types and constants
export { SupabaseStorageService };
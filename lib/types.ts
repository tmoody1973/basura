export type UserType = 'student' | 'journalist' | 'citizen';
export type JurisdictionType = 'city' | 'county' | 'state' | 'federal';

export interface Document {
  id: string;
  name: string;
  size: number;
  jurisdiction: JurisdictionType;
  pageCount: number;
  uploadedAt: string;
  processedAt?: string;
  status: 'uploading' | 'processing' | 'processed' | 'error';
  userId?: string;
  metadata?: {
    fiscalYear?: string;
    department?: string;
    documentType?: string;
  };
}

export interface Conversation {
  id: string;
  title: string;
  documentId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage?: string;
  bookmarked?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  charts?: ChartData[];
  createdAt: string;
}

export interface Citation {
  pageNumber: number;
  section: string;
  preview: string;
  confidence?: number;
}

export interface ChartData {
  type: 'pie' | 'bar' | 'line' | 'comparison';
  data: any[];
  title?: string;
  description?: string;
}

export interface BudgetData {
  categories: {
    name: string;
    amount: number;
    percentage: number;
    subcategories?: {
      name: string;
      amount: number;
    }[];
  }[];
  totalBudget: number;
  fiscalYear: string;
  jurisdiction: JurisdictionType;
}
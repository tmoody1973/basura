import { supabase, getSupabaseAdmin } from './client';
import type { Document, Conversation, Message } from '@/lib/types';

// Database helper functions for Budget Explorer

// Profile management
export async function createUserProfile(clerkUserId: string, email: string, fullName?: string, userType?: string, role?: string) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      clerk_user_id: clerkUserId,
      email,
      full_name: fullName,
      user_type: userType || 'citizen',
      role: role || 'user',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserProfile(clerkUserId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Role management
export async function isUserAdmin(clerkUserId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_user_admin', {
    user_clerk_id: clerkUserId,
  });

  if (error) throw error;
  return data || false;
}

export async function getUserRole(clerkUserId: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_user_role', {
    user_clerk_id: clerkUserId,
  });

  if (error) throw error;
  return data || 'user';
}

export async function updateUserRole(clerkUserId: string, role: 'admin' | 'user') {
  const { data, error } = await getSupabaseAdmin()
    .from('profiles')
    .update({ role })
    .eq('clerk_user_id', clerkUserId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Document management
export async function createDocument(documentData: Partial<Document> & { user_id: string }) {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: documentData.user_id,
      name: documentData.name!,
      original_filename: documentData.name!,
      file_size: documentData.size!,
      file_path: `${documentData.user_id}/${documentData.id}`,
      jurisdiction_type: documentData.jurisdiction,
      processing_status: 'uploading',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDocumentStatus(documentId: string, status: string, metadata?: any) {
  const updateData: any = { processing_status: status };
  if (metadata) updateData.metadata = metadata;

  const { data, error } = await supabase
    .from('documents')
    .update(updateData)
    .eq('id', documentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserDocuments(userId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Get all processed documents for browsing (for regular users)
export async function getAllProcessedDocuments() {
  const { data, error } = await supabase
    .from('documents')
    .select(`
      id,
      name,
      original_filename,
      file_size,
      jurisdiction_type,
      jurisdiction_name,
      processing_status,
      metadata,
      created_at,
      profiles!inner (
        full_name,
        role
      )
    `)
    .eq('processing_status', 'processed')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Document chunks for RAG
export async function insertDocumentChunks(chunks: any[]) {
  const { data, error } = await getSupabaseAdmin()
    .from('document_chunks')
    .insert(chunks)
    .select();

  if (error) throw error;
  return data;
}

export async function searchDocumentChunks(documentId: string, embedding: number[], limit = 5) {
  const { data, error } = await supabase.rpc('match_document_chunks', {
    input_document_id: documentId,
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: limit,
  });

  if (error) throw error;
  return data;
}

// Conversation management
export async function createConversation(userId: string, documentId: string, title: string, threadId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      document_id: documentId,
      title,
      thread_id: threadId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserConversations(userId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      documents (
        name,
        jurisdiction_type,
        jurisdiction_name
      )
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateConversation(conversationId: string, updates: Partial<Conversation>) {
  const { data, error } = await supabase
    .from('conversations')
    .update(updates)
    .eq('id', conversationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Message management
export async function insertMessage(message: Partial<Message> & { conversation_id: string }) {
  const { data, error } = await supabase
    .from('messages')
    .insert(message)
    .select()
    .single();

  if (error) throw error;

  // Update conversation message count and last message time
  await supabase.rpc('increment_conversation_messages', {
    conversation_id: message.conversation_id,
  });

  return data;
}

export async function getConversationMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

// Storage helpers
export async function uploadDocument(file: File, userId: string, documentId: string) {
  const filePath = `${userId}/${documentId}.pdf`;

  const { data, error } = await supabase.storage
    .from('budget-documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;
  return data;
}

export async function getDocumentUrl(filePath: string) {
  const { data } = supabase.storage
    .from('budget-documents')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function deleteDocument(filePath: string) {
  const { error } = await supabase.storage
    .from('budget-documents')
    .remove([filePath]);

  if (error) throw error;
}
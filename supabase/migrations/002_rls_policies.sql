-- Row Level Security Policies for Budget Explorer
-- Ensures users can only access their own data

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's profile ID
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id FROM profiles
        WHERE clerk_user_id = auth.jwt() ->> 'sub'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (clerk_user_id = auth.jwt() ->> 'sub');

-- Documents policies
CREATE POLICY "Users can view own documents" ON documents
    FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can insert own documents" ON documents
    FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update own documents" ON documents
    FOR UPDATE USING (user_id = get_current_user_id());

CREATE POLICY "Users can delete own documents" ON documents
    FOR DELETE USING (user_id = get_current_user_id());

-- Document chunks policies (inherit from documents)
CREATE POLICY "Users can view chunks of own documents" ON document_chunks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = document_chunks.document_id
            AND documents.user_id = get_current_user_id()
        )
    );

CREATE POLICY "Users can insert chunks for own documents" ON document_chunks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = document_chunks.document_id
            AND documents.user_id = get_current_user_id()
        )
    );

CREATE POLICY "Users can update chunks of own documents" ON document_chunks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = document_chunks.document_id
            AND documents.user_id = get_current_user_id()
        )
    );

CREATE POLICY "Users can delete chunks of own documents" ON document_chunks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM documents
            WHERE documents.id = document_chunks.document_id
            AND documents.user_id = get_current_user_id()
        )
    );

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can insert own conversations" ON conversations
    FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update own conversations" ON conversations
    FOR UPDATE USING (user_id = get_current_user_id());

CREATE POLICY "Users can delete own conversations" ON conversations
    FOR DELETE USING (user_id = get_current_user_id());

-- Messages policies (inherit from conversations)
CREATE POLICY "Users can view messages in own conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND conversations.user_id = get_current_user_id()
        )
    );

CREATE POLICY "Users can insert messages in own conversations" ON messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND conversations.user_id = get_current_user_id()
        )
    );

CREATE POLICY "Users can update messages in own conversations" ON messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND conversations.user_id = get_current_user_id()
        )
    );

CREATE POLICY "Users can delete messages in own conversations" ON messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND conversations.user_id = get_current_user_id()
        )
    );

-- Podcasts policies
CREATE POLICY "Users can view own podcasts" ON podcasts
    FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "Users can insert own podcasts" ON podcasts
    FOR INSERT WITH CHECK (user_id = get_current_user_id());

CREATE POLICY "Users can update own podcasts" ON podcasts
    FOR UPDATE USING (user_id = get_current_user_id());

CREATE POLICY "Users can delete own podcasts" ON podcasts
    FOR DELETE USING (user_id = get_current_user_id());
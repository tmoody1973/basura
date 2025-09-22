-- Add role-based system to profiles table

-- Add role column to profiles table
ALTER TABLE profiles
ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user'));

-- Create index for role queries
CREATE INDEX idx_profiles_role ON profiles(role);

-- Update existing profiles to have 'user' role by default
UPDATE profiles SET role = 'user' WHERE role IS NULL;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(user_clerk_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE clerk_user_id = user_clerk_id
    AND role = 'admin'
  );
END;
$$;

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_clerk_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE clerk_user_id = user_clerk_id;

  RETURN COALESCE(user_role, 'user');
END;
$$;

-- Update RLS policies for documents table to allow admins to manage all documents
DROP POLICY IF EXISTS "Users can only see their own documents" ON documents;

CREATE POLICY "Users can see their own documents and admins can see all" ON documents
FOR SELECT USING (
  user_id = auth.uid() OR
  is_user_admin(auth.jwt() ->> 'sub')
);

CREATE POLICY "Users can insert their own documents" ON documents
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update any document, users can update their own" ON documents
FOR UPDATE USING (
  user_id = auth.uid() OR
  is_user_admin(auth.jwt() ->> 'sub')
);

CREATE POLICY "Admins can delete any document, users can delete their own" ON documents
FOR DELETE USING (
  user_id = auth.uid() OR
  is_user_admin(auth.jwt() ->> 'sub')
);
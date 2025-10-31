-- Create Storage Buckets for ChatDesk

-- 1. Chat Media Bucket (images, audio, files sent in chats)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-media',
  'chat-media',
  false,
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Avatars Bucket (user profile pictures)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public so avatars can be displayed
  2097152, -- 2MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 3. Organization Logos Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization-logos',
  'organization-logos',
  true, -- Public so logos can be displayed
  2097152, -- 2MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'image/webp'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for chat-media bucket
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload chat media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-media');

-- Allow users to view their own organization's media
CREATE POLICY "Users can view their organization's chat media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-media');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own chat media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-media' AND owner::uuid = auth.uid());

-- Storage Policies for avatars bucket
-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow anyone to view avatars (public bucket)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND owner::uuid = auth.uid());

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND owner::uuid = auth.uid());

-- Storage Policies for organization-logos bucket
-- Allow authenticated users to upload logos
CREATE POLICY "Users can upload organization logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'organization-logos');

-- Allow anyone to view logos (public bucket)
CREATE POLICY "Anyone can view organization logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization-logos');

-- Allow users to update their organization's logo
CREATE POLICY "Users can update their organization logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'organization-logos');

-- Allow users to delete their organization's logo
CREATE POLICY "Users can delete their organization logo"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'organization-logos');


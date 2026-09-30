-- Fix anonymous chat photo uploads (2026-09-27 incident).
--
-- The 2026-04-12 migration (6cdb92d7) replaced the original anon-friendly
-- damage-photos policies with authenticated-only, UID-folder-scoped policies.
-- That broke the chat upload path: the chat is anonymous by design and uploads
-- to chat-<uuid>.<ext> with the anon key, so every upload has since failed
-- with "new row violates row-level security policy" ("Failed to upload photo."
-- in the UI).
--
-- This restores scoped anonymous access for chat-uploaded photos only.
-- Authenticated users keep their UID-folder policies from 6cdb92d7.

CREATE POLICY "Anon chat photo uploads"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'damage-photos'
  AND name LIKE 'chat-%'
);

CREATE POLICY "Anon chat photo reads"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'damage-photos'
  AND name LIKE 'chat-%'
);

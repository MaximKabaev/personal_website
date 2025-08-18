-- Add images column to devlog_entries table to store image metadata directly
-- This provides a simpler approach than using the separate project_media table
ALTER TABLE devlog_entries 
ADD COLUMN images JSONB DEFAULT '[]'::jsonb;

-- Create an index on the images column for better query performance
CREATE INDEX idx_devlog_entries_images ON devlog_entries USING GIN (images);

-- Add a comment to document the structure
COMMENT ON COLUMN devlog_entries.images IS 'Array of image objects with structure: [{"id": "uuid", "url": "string", "filename": "string", "size": number, "uploaded_at": "timestamp", "alt_text": "string"}]';
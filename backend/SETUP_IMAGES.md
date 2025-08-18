# Image Upload Setup Guide

This guide covers setting up image upload functionality for devlog entries.

## 1. Database Migration

Run the SQL migration to add the images column to the devlog_entries table:

```sql
-- Connect to your Supabase database and run:
-- (You can use the Supabase SQL editor or any PostgreSQL client)

-- Add images column to devlog_entries table
ALTER TABLE devlog_entries 
ADD COLUMN images JSONB DEFAULT '[]'::jsonb;

-- Create an index on the images column for better query performance
CREATE INDEX idx_devlog_entries_images ON devlog_entries USING GIN (images);

-- Add a comment to document the structure
COMMENT ON COLUMN devlog_entries.images IS 'Array of image objects with structure: [{"id": "uuid", "url": "string", "filename": "string", "size": number, "uploaded_at": "timestamp", "alt_text": "string"}]';
```

## 2. Supabase Storage Setup

### Create Storage Bucket

1. Go to your Supabase dashboard
2. Navigate to **Storage** in the sidebar
3. Click **New bucket**
4. Create a bucket named: `devlog-images`
5. Set it as **Public** (so images can be displayed without authentication)

### Set Storage Policies

In the Supabase SQL editor, run these policies:

```sql
-- Allow public reading of images
CREATE POLICY "Public devlog images are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'devlog-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload devlog images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'devlog-images' 
    AND auth.role() = 'authenticated'
  );

-- Allow authenticated users to delete their uploaded images
CREATE POLICY "Authenticated users can delete devlog images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'devlog-images' 
    AND auth.role() = 'authenticated'
  );
```

## 3. Environment Variables

Ensure your frontend has these environment variables set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 4. Testing

1. Start your backend server
2. Start your frontend development server
3. Navigate to `/admin` and log in
4. Go to the **Devlog** tab
5. Create or edit a devlog entry
6. Try uploading images using the drag-and-drop interface
7. Save the entry and view it on the project page to see the images displayed

## 5. Image Constraints

The current setup has these constraints:
- Maximum 5 images per devlog entry
- Maximum 5MB per image
- Supported formats: JPEG, PNG, WebP, GIF
- Images are stored in Supabase Storage with public access

## 6. Features Included

- ✅ Drag & drop image upload in admin panel
- ✅ Image preview with progress indicators
- ✅ Image deletion and reordering
- ✅ Responsive image gallery on project pages
- ✅ Lightbox for viewing full-size images
- ✅ Image metadata storage (filename, size, upload date)
- ✅ Error handling and validation
- ✅ Mobile-friendly interface

## Troubleshooting

**Images not uploading:**
- Check Supabase storage policies
- Verify bucket name matches `devlog-images`
- Check browser console for errors

**Images not displaying:**
- Ensure bucket is set to public
- Check image URLs in database
- Verify CORS settings in Supabase

**Admin panel not working:**
- Ensure you're authenticated
- Check if `project_id` is selected before uploading images
- Verify backend API is running and accessible
import { createClient } from './supabase'
import type { DevlogImage } from './api'

const BUCKET_NAME = 'devlog-images'

export interface UploadResult {
  success: boolean
  data?: DevlogImage
  error?: string
}

export class StorageService {
  private supabase = createClient()

  async uploadImage(file: File, projectId: string): Promise<UploadResult> {
    try {
      // Validate file
      const validationError = this.validateFile(file)
      if (validationError) {
        return { success: false, error: validationError }
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${projectId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        return { success: false, error: 'Failed to upload image' }
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path)

      const devlogImage: DevlogImage = {
        id: data.id || crypto.randomUUID(),
        url: urlData.publicUrl,
        filename: file.name,
        size: file.size,
        uploaded_at: new Date().toISOString()
      }

      return { success: true, data: devlogImage }
    } catch (error) {
      console.error('Storage service error:', error)
      return { success: false, error: 'Unexpected error during upload' }
    }
  }

  async deleteImage(imageUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Extract path from URL
      const url = new URL(imageUrl)
      const pathParts = url.pathname.split('/')
      const bucketIndex = pathParts.indexOf(BUCKET_NAME)
      
      if (bucketIndex === -1) {
        return { success: false, error: 'Invalid image URL' }
      }

      const filePath = pathParts.slice(bucketIndex + 1).join('/')

      const { error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath])

      if (error) {
        console.error('Delete error:', error)
        return { success: false, error: 'Failed to delete image' }
      }

      return { success: true }
    } catch (error) {
      console.error('Storage delete error:', error)
      return { success: false, error: 'Unexpected error during deletion' }
    }
  }

  async uploadMultipleImages(files: File[], projectId: string): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, projectId))
    return Promise.all(uploadPromises)
  }

  private validateFile(file: File): string | null {
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return 'File size must be less than 5MB'
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return 'Only JPEG, PNG, WebP and GIF images are allowed'
    }

    return null
  }

  getImageUrl(path: string): string {
    const { data } = this.supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(path)
    
    return data.publicUrl
  }
}

export const storageService = new StorageService()
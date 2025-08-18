'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Upload, X, AlertCircle, Check, Loader2, Image as ImageIcon } from 'lucide-react'
import { storageService } from '@/lib/storage'
import type { DevlogImage } from '@/lib/api'

interface ImageUploaderProps {
  projectId: string
  initialImages?: DevlogImage[]
  onImagesChange: (images: DevlogImage[]) => void
  maxImages?: number
  disabled?: boolean
}

interface UploadState {
  uploading: boolean
  progress: number
  error?: string
}

export default function ImageUploader({ 
  projectId, 
  initialImages = [], 
  onImagesChange, 
  maxImages = 10,
  disabled = false 
}: ImageUploaderProps) {
  const [images, setImages] = useState<DevlogImage[]>(initialImages)
  const [uploadState, setUploadState] = useState<UploadState>({ uploading: false, progress: 0 })
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateImages = useCallback((newImages: DevlogImage[]) => {
    setImages(newImages)
    onImagesChange(newImages)
  }, [onImagesChange])

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return

    const fileArray = Array.from(files)
    const remainingSlots = maxImages - images.length
    
    if (fileArray.length > remainingSlots) {
      setUploadState({
        uploading: false,
        progress: 0,
        error: `Can only upload ${remainingSlots} more image(s). Maximum is ${maxImages}.`
      })
      return
    }

    setUploadState({ uploading: true, progress: 0, error: undefined })

    try {
      const uploadResults = await storageService.uploadMultipleImages(fileArray, projectId)
      
      const successfulUploads = uploadResults
        .filter(result => result.success && result.data)
        .map(result => result.data!)

      const failedUploads = uploadResults.filter(result => !result.success)

      if (successfulUploads.length > 0) {
        updateImages([...images, ...successfulUploads])
      }

      if (failedUploads.length > 0) {
        const errorMessages = failedUploads.map(result => result.error).join(', ')
        setUploadState({
          uploading: false,
          progress: 100,
          error: `Some uploads failed: ${errorMessages}`
        })
      } else {
        setUploadState({ uploading: false, progress: 100 })
      }

      // Clear success state after delay
      if (failedUploads.length === 0) {
        setTimeout(() => {
          setUploadState({ uploading: false, progress: 0 })
        }, 2000)
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadState({
        uploading: false,
        progress: 0,
        error: 'Failed to upload images. Please try again.'
      })
    }
  }

  const removeImage = async (imageToRemove: DevlogImage) => {
    if (disabled) return

    try {
      await storageService.deleteImage(imageToRemove.url)
      updateImages(images.filter(img => img.id !== imageToRemove.id))
    } catch (error) {
      console.error('Failed to delete image:', error)
      setUploadState({
        uploading: false,
        progress: 0,
        error: 'Failed to delete image. Please try again.'
      })
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true)
    }
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-muted'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-muted-foreground/50 cursor-pointer'}
        `}
        onClick={openFileDialog}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-2">
          {uploadState.uploading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm text-muted-foreground">Uploading images...</p>
              <div className="w-full max-w-xs bg-muted rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WebP or GIF (max 5MB each)
                </p>
                <p className="text-xs text-muted-foreground">
                  {images.length}/{maxImages} images
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {uploadState.error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{uploadState.error}</p>
          <button
            onClick={() => setUploadState(prev => ({ ...prev, error: undefined }))}
            className="ml-auto text-red-500 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Message */}
      {uploadState.progress === 100 && !uploadState.uploading && !uploadState.error && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
          <Check className="w-4 h-4 text-green-500" />
          <p className="text-sm text-green-700 dark:text-green-300">Images uploaded successfully!</p>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={image.url}
                  alt={image.filename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              
              {/* Remove Button */}
              {!disabled && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(image)
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                </button>
              )}

              {/* Image Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs truncate">{image.filename}</p>
                <p className="text-xs text-gray-300">{(image.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !uploadState.uploading && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No images uploaded yet</p>
        </div>
      )}
    </div>
  )
}
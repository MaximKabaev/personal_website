'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { X, ZoomIn, ExternalLink } from 'lucide-react'
import type { DevlogImage } from '@/lib/api'

interface DevlogImageProps {
  image: DevlogImage
  className?: string
  showLightbox?: boolean
}

interface DevlogImageGalleryProps {
  images: DevlogImage[]
  className?: string
  maxDisplay?: number
}

interface LightboxProps {
  image: DevlogImage
  isOpen: boolean
  onClose: () => void
  onNext?: () => void
  onPrev?: () => void
  hasNext?: boolean
  hasPrev?: boolean
}

function Lightbox({ image, isOpen, onClose, onNext, onPrev, hasNext, hasPrev }: LightboxProps) {
  if (!isOpen) return null

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowRight' && hasNext) onNext?.()
    if (e.key === 'ArrowLeft' && hasPrev) onPrev?.()
  }

  return (
    <div 
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
        aria-label="Close lightbox"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Previous button */}
      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPrev?.()
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10"
          aria-label="Previous image"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next button */}
      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onNext?.()
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10"
          aria-label="Next image"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div 
        className="relative max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={image.url}
          alt={image.alt_text || image.filename}
          className="max-w-full max-h-full object-contain"
          loading="lazy"
        />
        
        {/* Image info */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{image.alt_text || image.filename}</p>
              <p className="text-sm text-gray-300">
                {(image.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <a
              href={image.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Open original
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DevlogImage({ image, className = '', showLightbox = true }: DevlogImageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  return (
    <>
      <div 
        className={`relative group cursor-pointer overflow-hidden rounded-lg bg-muted ${className}`}
        onClick={() => showLightbox && setLightboxOpen(true)}
      >
        <Image
          src={image.url}
          alt={image.alt_text || image.filename}
          width={400}
          height={300}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
        
        {showLightbox && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
        
        {/* Image overlay with filename */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-white text-sm truncate">
            {image.alt_text || image.filename}
          </p>
        </div>
      </div>

      {showLightbox && (
        <Lightbox
          image={image}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  )
}

export function DevlogImageGallery({ images, className = '', maxDisplay = 4 }: DevlogImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)

  if (!images || images.length === 0) return null

  const displayImages = showAll ? images : images.slice(0, maxDisplay)
  const remainingCount = images.length - maxDisplay

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
  }

  const closeLightbox = () => {
    setLightboxIndex(null)
  }

  const nextImage = () => {
    if (lightboxIndex !== null && lightboxIndex < images.length - 1) {
      setLightboxIndex(lightboxIndex + 1)
    }
  }

  const prevImage = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1)
    }
  }

  return (
    <>
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {displayImages.map((image, index) => (
            <div
              key={image.id}
              className="relative aspect-video cursor-pointer overflow-hidden rounded-lg bg-muted group"
              onClick={() => openLightbox(index)}
            >
              <Image
                src={image.url}
                alt={image.alt_text || image.filename}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                loading="lazy"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
              />
              
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              {/* Show remaining count on last visible image */}
              {!showAll && index === maxDisplay - 1 && remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    +{remainingCount} more
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Show more/less button */}
        {images.length > maxDisplay && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAll ? 'Show less' : `Show all ${images.length} images`}
          </button>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          image={images[lightboxIndex]}
          isOpen={lightboxIndex !== null}
          onClose={closeLightbox}
          onNext={nextImage}
          onPrev={prevImage}
          hasNext={lightboxIndex < images.length - 1}
          hasPrev={lightboxIndex > 0}
        />
      )}
    </>
  )
}
/**
 * Mictla Media Service
 * Handles photo compression, audio recording, and media validation
 */

import { validationService } from './ValidationService.js'

export class MediaService {
  constructor() {
    this.mediaRecorder = null
    this.audioStream = null
    this.audioChunks = []
    
    // Configuration
    this.imageConfig = {
      maxWidth: 800,
      maxHeight: 600,
      quality: 0.8,
      format: 'image/jpeg'
    }
    
    this.audioConfig = {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 128000
    }
  }

  /**
   * Compress and validate image file
   * @param {File} file - Image file to process
   * @param {Object} options - Compression options
   * @returns {Promise<string>} Base64 encoded compressed image
   */
  async processImage(file, options = {}) {
    // Validate file first
    const validation = validationService.validateImageFile(file)
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '))
    }
    
    const config = { ...this.imageConfig, ...options }
    
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        try {
          // Calculate new dimensions maintaining aspect ratio
          let { width, height } = img
          
          if (width > config.maxWidth || height > config.maxHeight) {
            const aspectRatio = width / height
            
            if (width > height) {
              width = config.maxWidth
              height = width / aspectRatio
              
              if (height > config.maxHeight) {
                height = config.maxHeight
                width = height * aspectRatio
              }
            } else {
              height = config.maxHeight
              width = height * aspectRatio
              
              if (width > config.maxWidth) {
                width = config.maxWidth
                height = width / aspectRatio
              }
            }
          }
          
          // Set canvas dimensions
          canvas.width = width
          canvas.height = height
          
          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          
          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to base64 with compression
          const compressedDataUrl = canvas.toDataURL(config.format, config.quality)
          
          // Check if compressed size is reasonable (< 1MB base64)
          if (compressedDataUrl.length > 1.5 * 1024 * 1024) {
            // Try with lower quality
            const lowerQualityDataUrl = canvas.toDataURL(config.format, 0.6)
            resolve(lowerQualityDataUrl)
          } else {
            resolve(compressedDataUrl)
          }
          
        } catch (error) {
          reject(new Error('Failed to compress image: ' + error.message))
        }
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image for compression'))
      }
      
      // Load image from file
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Create thumbnail from image
   * @param {string} imageDataUrl - Base64 image data
   * @param {number} size - Thumbnail size (width/height)
   * @returns {Promise<string>} Base64 encoded thumbnail
   */
  async createThumbnail(imageDataUrl, size = 150) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        try {
          // Set square canvas
          canvas.width = size
          canvas.height = size
          
          // Calculate crop dimensions for square thumbnail
          const { width, height } = img
          const minDimension = Math.min(width, height)
          const cropX = (width - minDimension) / 2
          const cropY = (height - minDimension) / 2
          
          // Enable smoothing
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          
          // Draw cropped and scaled image
          ctx.drawImage(
            img,
            cropX, cropY, minDimension, minDimension,
            0, 0, size, size
          )
          
          const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8)
          resolve(thumbnailDataUrl)
          
        } catch (error) {
          reject(new Error('Failed to create thumbnail: ' + error.message))
        }
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image for thumbnail'))
      }
      
      img.src = imageDataUrl
    })
  }

  /**
   * Start audio recording
   * @returns {Promise<void>}
   */
  async startAudioRecording() {
    try {
      // Request microphone access
      this.audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      // Check for supported MIME types
      let mimeType = this.audioConfig.mimeType
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        // Fallback options
        const fallbackTypes = [
          'audio/webm',
          'audio/mp4',
          'audio/ogg;codecs=opus',
          'audio/wav'
        ]
        
        mimeType = fallbackTypes.find(type => MediaRecorder.isTypeSupported(type))
        
        if (!mimeType) {
          throw new Error('No supported audio format found')
        }
      }
      
      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType,
        audioBitsPerSecond: this.audioConfig.audioBitsPerSecond
      })
      
      this.audioChunks = []
      
      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }
      
      // Start recording
      this.mediaRecorder.start(1000) // Collect data every second
      
    } catch (error) {
      this.stopAudioRecording() // Clean up
      throw new Error('Failed to start audio recording: ' + error.message)
    }
  }

  /**
   * Stop audio recording and get result
   * @returns {Promise<string>} Base64 encoded audio data
   */
  async stopAudioRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'))
        return
      }
      
      this.mediaRecorder.onstop = async () => {
        try {
          // Create blob from chunks
          const audioBlob = new Blob(this.audioChunks, { 
            type: this.mediaRecorder.mimeType 
          })
          
          // Validate audio size
          const validation = validationService.validateAudioFile(
            new File([audioBlob], 'recording.webm', { type: audioBlob.type })
          )
          
          if (!validation.isValid) {
            reject(new Error(validation.errors.join(', ')))
            return
          }
          
          // Convert to base64
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = () => reject(new Error('Failed to convert audio to base64'))
          reader.readAsDataURL(audioBlob)
          
        } catch (error) {
          reject(new Error('Failed to process audio recording: ' + error.message))
        } finally {
          this.cleanup()
        }
      }
      
      this.mediaRecorder.onerror = (error) => {
        this.cleanup()
        reject(new Error('Recording error: ' + error.message))
      }
      
      // Stop recording
      if (this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop()
      } else {
        this.cleanup()
        reject(new Error('Recording is not active'))
      }
    })
  }

  /**
   * Cancel audio recording
   */
  cancelAudioRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop()
    }
    this.cleanup()
  }

  /**
   * Check if audio recording is supported
   * @returns {boolean} True if supported
   */
  isAudioRecordingSupported() {
    return !!(navigator.mediaDevices && 
             navigator.mediaDevices.getUserMedia && 
             window.MediaRecorder)
  }

  /**
   * Get audio recording state
   * @returns {string} Recording state
   */
  getRecordingState() {
    return this.mediaRecorder ? this.mediaRecorder.state : 'inactive'
  }

  /**
   * Process audio file (validate and convert)
   * @param {File} file - Audio file to process
   * @returns {Promise<string>} Base64 encoded audio
   */
  async processAudioFile(file) {
    // Validate file
    const validation = validationService.validateAudioFile(file)
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '))
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => reject(new Error('Failed to read audio file'))
      reader.readAsDataURL(file)
    })
  }

  /**
   * Create audio preview element
   * @param {string} audioDataUrl - Base64 audio data
   * @returns {HTMLAudioElement} Audio element
   */
  createAudioPreview(audioDataUrl) {
    const audio = document.createElement('audio')
    audio.controls = true
    audio.preload = 'metadata'
    audio.src = audioDataUrl
    
    // Add error handling
    audio.onerror = () => {
      console.error('Audio preview error')
    }
    
    return audio
  }

  /**
   * Get audio duration from data URL
   * @param {string} audioDataUrl - Base64 audio data
   * @returns {Promise<number>} Duration in seconds
   */
  async getAudioDuration(audioDataUrl) {
    return new Promise((resolve, reject) => {
      const audio = document.createElement('audio')
      
      audio.onloadedmetadata = () => {
        resolve(audio.duration)
      }
      
      audio.onerror = () => {
        reject(new Error('Failed to load audio metadata'))
      }
      
      audio.src = audioDataUrl
    })
  }

  /**
   * Convert image to different format
   * @param {string} imageDataUrl - Source image data URL
   * @param {string} format - Target format ('image/jpeg', 'image/png', 'image/webp')
   * @param {number} quality - Quality (0-1)
   * @returns {Promise<string>} Converted image data URL
   */
  async convertImageFormat(imageDataUrl, format = 'image/jpeg', quality = 0.8) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        try {
          canvas.width = img.width
          canvas.height = img.height
          
          // Handle transparency for JPEG
          if (format === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
          }
          
          ctx.drawImage(img, 0, 0)
          const convertedDataUrl = canvas.toDataURL(format, quality)
          resolve(convertedDataUrl)
          
        } catch (error) {
          reject(new Error('Failed to convert image format: ' + error.message))
        }
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image for conversion'))
      }
      
      img.src = imageDataUrl
    })
  }

  /**
   * Batch process multiple images
   * @param {File[]} files - Array of image files
   * @param {Object} options - Processing options
   * @returns {Promise<string[]>} Array of processed image data URLs
   */
  async batchProcessImages(files, options = {}) {
    const results = []
    const errors = []
    
    for (let i = 0; i < files.length; i++) {
      try {
        const processed = await this.processImage(files[i], options)
        results.push(processed)
      } catch (error) {
        errors.push({ index: i, file: files[i].name, error: error.message })
        results.push(null)
      }
    }
    
    if (errors.length > 0) {
      console.warn('Some images failed to process:', errors)
    }
    
    return results
  }

  /**
   * Get image metadata
   * @param {string} imageDataUrl - Image data URL
   * @returns {Promise<Object>} Image metadata
   */
  async getImageMetadata(imageDataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        const metadata = {
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
          size: imageDataUrl.length,
          format: imageDataUrl.split(';')[0].split(':')[1]
        }
        resolve(metadata)
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image for metadata'))
      }
      
      img.src = imageDataUrl
    })
  }

  /**
   * Clean up resources
   */
  cleanup() {
    // Stop audio stream
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop())
      this.audioStream = null
    }
    
    // Clear recorder
    this.mediaRecorder = null
    this.audioChunks = []
  }

  /**
   * Destroy service and clean up all resources
   */
  destroy() {
    this.cancelAudioRecording()
    this.cleanup()
  }
}

// Create singleton instance
export const mediaService = new MediaService()
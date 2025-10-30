/**
 * AR Performance Optimizer
 * Handles device capability detection, automatic quality adjustment, and memory management
 */

import * as THREE from 'three'
import { appState } from '../../state/AppState.js'

export class ARPerformanceOptimizer {
  constructor(renderer, scene, camera) {
    this.renderer = renderer
    this.scene = scene
    this.camera = camera
    
    // Performance monitoring
    this.performanceMonitor = {
      fps: 60,
      frameCount: 0,
      lastTime: performance.now(),
      averageFPS: 60,
      fpsHistory: [],
      memoryUsage: 0,
      renderTime: 0
    }
    
    // Device capabilities
    this.deviceCapabilities = {
      maxTextureSize: 1024,
      maxMemory: 512, // MB
      supportedFeatures: new Set(),
      performanceLevel: 'medium',
      isMobile: false,
      hasLowPowerMode: false
    }
    
    // Quality settings
    this.qualityLevels = {
      high: {
        shadowMapSize: 2048,
        antialias: true,
        pixelRatio: Math.min(window.devicePixelRatio, 2),
        maxObjects: 100,
        maxMemorials: 20,
        maxOfferings: 50,
        textureQuality: 1.0,
        animationQuality: 'high',
        particleCount: 100,
        lodDistance: 50
      },
      medium: {
        shadowMapSize: 1024,
        antialias: true,
        pixelRatio: Math.min(window.devicePixelRatio, 1.5),
        maxObjects: 60,
        maxMemorials: 15,
        maxOfferings: 30,
        textureQuality: 0.75,
        animationQuality: 'medium',
        particleCount: 50,
        lodDistance: 30
      },
      low: {
        shadowMapSize: 512,
        antialias: false,
        pixelRatio: 1,
        maxObjects: 30,
        maxMemorials: 10,
        maxOfferings: 15,
        textureQuality: 0.5,
        animationQuality: 'low',
        particleCount: 25,
        lodDistance: 20
      }
    }
    
    this.currentQuality = 'medium'
    this.adaptiveQuality = true
    this.optimizationEnabled = true
    
    // Memory management
    this.memoryManager = {
      textureCache: new Map(),
      geometryCache: new Map(),
      materialCache: new Map(),
      disposedObjects: new Set(),
      maxCacheSize: 50
    }
    
    // LOD system
    this.lodSystem = {
      enabled: true,
      levels: new Map(),
      updateInterval: 100, // ms
      lastUpdate: 0
    }
    
    this.init()
  }

  /**
   * Initialize performance optimizer
   */
  async init() {
    console.log('⚡ Initializing AR Performance Optimizer...')
    
    // Detect device capabilities
    await this.detectDeviceCapabilities()
    
    // Set initial quality level
    this.setQualityLevel(this.deviceCapabilities.performanceLevel)
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring()
    
    // Setup memory management
    this.setupMemoryManagement()
    
    // Setup LOD system
    this.setupLODSystem()
    
    // Setup adaptive quality
    this.setupAdaptiveQuality()
    
    console.log('✅ AR Performance Optimizer initialized')
    console.log('📊 Device capabilities:', this.deviceCapabilities)
    console.log('🎚️ Quality level:', this.currentQuality)
  }

  /**
   * Detect device capabilities
   */
  async detectDeviceCapabilities() {
    const gl = this.renderer.getContext()
    
    // Basic WebGL capabilities
    this.deviceCapabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
    this.deviceCapabilities.maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)
    this.deviceCapabilities.maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS)
    
    // Memory estimation
    if (navigator.deviceMemory) {
      this.deviceCapabilities.maxMemory = navigator.deviceMemory * 1024 // Convert to MB
    } else {
      // Fallback estimation based on other factors
      this.deviceCapabilities.maxMemory = this.estimateDeviceMemory()
    }
    
    // Mobile detection
    this.deviceCapabilities.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    // Hardware concurrency
    this.deviceCapabilities.cores = navigator.hardwareConcurrency || 4
    
    // Performance level assessment
    this.deviceCapabilities.performanceLevel = this.assessPerformanceLevel()
    
    // WebXR features
    if ('xr' in navigator) {
      try {
        const session = await navigator.xr.requestSession('immersive-ar', {
          requiredFeatures: ['local'],
          optionalFeatures: ['dom-overlay', 'hit-test', 'anchors']
        })
        
        this.deviceCapabilities.supportedFeatures = new Set(session.enabledFeatures)
        await session.end()
      } catch (error) {
        console.warn('Could not detect WebXR features:', error)
      }
    }
    
    // Battery status (if available)
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery()
        this.deviceCapabilities.hasLowPowerMode = !battery.charging && battery.level < 0.2
      } catch (error) {
        console.warn('Could not access battery status:', error)
      }
    }
  }

  /**
   * Estimate device memory based on other factors
   */
  estimateDeviceMemory() {
    let memoryScore = 0
    
    // Screen resolution impact
    const screenPixels = window.screen.width * window.screen.height * (window.devicePixelRatio || 1)
    if (screenPixels > 2000000) memoryScore += 2048
    else if (screenPixels > 1000000) memoryScore += 1024
    else memoryScore += 512
    
    // Hardware concurrency
    const cores = navigator.hardwareConcurrency || 4
    memoryScore += cores * 256
    
    // Mobile vs desktop
    if (this.deviceCapabilities.isMobile) {
      memoryScore *= 0.5 // Mobile devices typically have less memory
    }
    
    return Math.min(memoryScore, 8192) // Cap at 8GB
  }

  /**
   * Assess overall performance level
   */
  assessPerformanceLevel() {
    let score = 0
    
    // Memory score
    if (this.deviceCapabilities.maxMemory >= 4096) score += 30
    else if (this.deviceCapabilities.maxMemory >= 2048) score += 20
    else if (this.deviceCapabilities.maxMemory >= 1024) score += 10
    
    // CPU cores
    if (this.deviceCapabilities.cores >= 8) score += 25
    else if (this.deviceCapabilities.cores >= 4) score += 15
    else if (this.deviceCapabilities.cores >= 2) score += 10
    
    // GPU capabilities
    if (this.deviceCapabilities.maxTextureSize >= 4096) score += 20
    else if (this.deviceCapabilities.maxTextureSize >= 2048) score += 15
    else if (this.deviceCapabilities.maxTextureSize >= 1024) score += 10
    
    // Mobile penalty
    if (this.deviceCapabilities.isMobile) score -= 15
    
    // Low power mode penalty
    if (this.deviceCapabilities.hasLowPowerMode) score -= 20
    
    // Determine level
    if (score >= 70) return 'high'
    else if (score >= 40) return 'medium'
    else return 'low'
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    const monitor = () => {
      const currentTime = performance.now()
      this.performanceMonitor.frameCount++
      
      // Calculate FPS every second
      if (currentTime - this.performanceMonitor.lastTime >= 1000) {
        this.performanceMonitor.fps = this.performanceMonitor.frameCount
        this.performanceMonitor.frameCount = 0
        this.performanceMonitor.lastTime = currentTime
        
        // Update FPS history
        this.performanceMonitor.fpsHistory.push(this.performanceMonitor.fps)
        if (this.performanceMonitor.fpsHistory.length > 10) {
          this.performanceMonitor.fpsHistory.shift()
        }
        
        // Calculate average FPS
        this.performanceMonitor.averageFPS = this.performanceMonitor.fpsHistory.reduce((a, b) => a + b, 0) / this.performanceMonitor.fpsHistory.length
        
        // Memory usage
        if (performance.memory) {
          this.performanceMonitor.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024 // MB
        }
        
        // Trigger adaptive quality if needed
        if (this.adaptiveQuality) {
          this.checkPerformanceThresholds()
        }
        
        // Update app state
        appState.set('arSession.performance', {
          fps: this.performanceMonitor.fps,
          averageFPS: this.performanceMonitor.averageFPS,
          memoryUsage: this.performanceMonitor.memoryUsage,
          qualityLevel: this.currentQuality
        })
      }
      
      requestAnimationFrame(monitor)
    }
    
    monitor()
  }

  /**
   * Check performance thresholds and adjust quality
   */
  checkPerformanceThresholds() {
    const avgFPS = this.performanceMonitor.averageFPS
    const memoryUsage = this.performanceMonitor.memoryUsage
    
    // Performance degradation thresholds
    const lowFPSThreshold = 25
    const highMemoryThreshold = this.deviceCapabilities.maxMemory * 0.8
    
    // Upgrade thresholds
    const goodFPSThreshold = 50
    const lowMemoryThreshold = this.deviceCapabilities.maxMemory * 0.5
    
    if (avgFPS < lowFPSThreshold || memoryUsage > highMemoryThreshold) {
      // Downgrade quality
      if (this.currentQuality === 'high') {
        this.setQualityLevel('medium')
        console.warn('⬇️ Downgraded to medium quality due to performance')
      } else if (this.currentQuality === 'medium') {
        this.setQualityLevel('low')
        console.warn('⬇️ Downgraded to low quality due to performance')
      }
    } else if (avgFPS > goodFPSThreshold && memoryUsage < lowMemoryThreshold) {
      // Upgrade quality (but be conservative)
      if (this.currentQuality === 'low' && this.canUpgradeQuality()) {
        this.setQualityLevel('medium')
        console.log('⬆️ Upgraded to medium quality')
      } else if (this.currentQuality === 'medium' && this.canUpgradeQuality()) {
        this.setQualityLevel('high')
        console.log('⬆️ Upgraded to high quality')
      }
    }
  }

  /**
   * Check if quality can be upgraded safely
   */
  canUpgradeQuality() {
    // Only upgrade if performance has been stable for a while
    const recentFPS = this.performanceMonitor.fpsHistory.slice(-5)
    return recentFPS.length >= 5 && recentFPS.every(fps => fps > 45)
  }

  /**
   * Set quality level
   */
  setQualityLevel(level) {
    if (!this.qualityLevels[level]) {
      console.error('Invalid quality level:', level)
      return
    }
    
    const oldQuality = this.currentQuality
    this.currentQuality = level
    const settings = this.qualityLevels[level]
    
    console.log(`🎚️ Setting quality level to ${level}`)
    
    // Apply renderer settings
    this.renderer.setPixelRatio(settings.pixelRatio)
    this.renderer.shadowMap.enabled = level !== 'low'
    
    if (this.renderer.shadowMap.enabled) {
      this.renderer.shadowMap.mapSize.width = settings.shadowMapSize
      this.renderer.shadowMap.mapSize.height = settings.shadowMapSize
    }
    
    // Update LOD distances
    this.lodSystem.maxDistance = settings.lodDistance
    
    // Apply texture quality
    this.applyTextureQuality(settings.textureQuality)
    
    // Notify components about quality change
    const event = new CustomEvent('quality-level-changed', {
      detail: { 
        oldLevel: oldQuality, 
        newLevel: level, 
        settings 
      }
    })
    document.dispatchEvent(event)
    
    // Update app state
    appState.set('arSession.qualityLevel', level)
  }

  /**
   * Apply texture quality settings
   */
  applyTextureQuality(quality) {
    const maxSize = Math.floor(this.deviceCapabilities.maxTextureSize * quality)
    
    this.scene.traverse((object) => {
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        
        materials.forEach(material => {
          if (material.map) {
            this.optimizeTexture(material.map, maxSize)
          }
          if (material.normalMap) {
            this.optimizeTexture(material.normalMap, maxSize)
          }
          if (material.roughnessMap) {
            this.optimizeTexture(material.roughnessMap, maxSize)
          }
        })
      }
    })
  }

  /**
   * Optimize individual texture
   */
  optimizeTexture(texture, maxSize) {
    if (!texture.image) return
    
    const { width, height } = texture.image
    
    if (width > maxSize || height > maxSize) {
      // Create canvas for resizing
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // Calculate new size maintaining aspect ratio
      const scale = Math.min(maxSize / width, maxSize / height)
      canvas.width = Math.floor(width * scale)
      canvas.height = Math.floor(height * scale)
      
      // Draw resized image
      ctx.drawImage(texture.image, 0, 0, canvas.width, canvas.height)
      
      // Update texture
      texture.image = canvas
      texture.needsUpdate = true
      
      console.log(`🖼️ Resized texture from ${width}x${height} to ${canvas.width}x${canvas.height}`)
    }
  }

  /**
   * Setup memory management
   */
  setupMemoryManagement() {
    // Periodic cleanup
    setInterval(() => {
      this.performMemoryCleanup()
    }, 30000) // Every 30 seconds
    
    // Cleanup on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.performMemoryCleanup()
      }
    })
  }

  /**
   * Perform memory cleanup
   */
  performMemoryCleanup() {
    console.log('🧹 Performing memory cleanup...')
    
    let disposedCount = 0
    
    // Clean up disposed objects
    this.memoryManager.disposedObjects.forEach(object => {
      if (object.geometry) {
        object.geometry.dispose()
        disposedCount++
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(mat => mat.dispose())
        } else {
          object.material.dispose()
        }
        disposedCount++
      }
    })
    
    this.memoryManager.disposedObjects.clear()
    
    // Clean up texture cache if too large
    if (this.memoryManager.textureCache.size > this.memoryManager.maxCacheSize) {
      const entries = Array.from(this.memoryManager.textureCache.entries())
      const toRemove = entries.slice(0, entries.length - this.memoryManager.maxCacheSize)
      
      toRemove.forEach(([key, texture]) => {
        texture.dispose()
        this.memoryManager.textureCache.delete(key)
        disposedCount++
      })
    }
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc()
    }
    
    console.log(`🗑️ Disposed ${disposedCount} objects`)
  }

  /**
   * Setup LOD (Level of Detail) system
   */
  setupLODSystem() {
    if (!this.lodSystem.enabled) return
    
    const updateLOD = () => {
      const currentTime = performance.now()
      
      if (currentTime - this.lodSystem.lastUpdate > this.lodSystem.updateInterval) {
        this.updateLODLevels()
        this.lodSystem.lastUpdate = currentTime
      }
      
      requestAnimationFrame(updateLOD)
    }
    
    updateLOD()
  }

  /**
   * Update LOD levels based on distance from camera
   */
  updateLODLevels() {
    const cameraPosition = this.camera.position
    const maxDistance = this.lodSystem.maxDistance
    
    this.scene.traverse((object) => {
      if (object.userData.lodEnabled) {
        const distance = cameraPosition.distanceTo(object.position)
        const normalizedDistance = Math.min(distance / maxDistance, 1)
        
        // Adjust object detail based on distance
        if (normalizedDistance > 0.8) {
          // Far: lowest detail
          this.setObjectLOD(object, 'low')
        } else if (normalizedDistance > 0.5) {
          // Medium distance: medium detail
          this.setObjectLOD(object, 'medium')
        } else {
          // Close: highest detail
          this.setObjectLOD(object, 'high')
        }
      }
    })
  }

  /**
   * Set LOD level for specific object
   */
  setObjectLOD(object, level) {
    if (object.userData.currentLOD === level) return
    
    object.userData.currentLOD = level
    
    switch (level) {
      case 'low':
        object.visible = object.userData.essential || false
        if (object.material) {
          object.material.wireframe = true
        }
        break
        
      case 'medium':
        object.visible = true
        if (object.material) {
          object.material.wireframe = false
        }
        // Reduce texture quality
        break
        
      case 'high':
        object.visible = true
        if (object.material) {
          object.material.wireframe = false
        }
        // Full texture quality
        break
    }
  }

  /**
   * Setup adaptive quality system
   */
  setupAdaptiveQuality() {
    // Listen for thermal throttling events (if available)
    if ('ondevicechange' in navigator) {
      navigator.addEventListener('devicechange', () => {
        console.log('📱 Device state changed, reassessing performance')
        this.detectDeviceCapabilities()
      })
    }
    
    // Listen for battery level changes
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        battery.addEventListener('levelchange', () => {
          if (battery.level < 0.2 && !battery.charging) {
            console.log('🔋 Low battery detected, reducing quality')
            this.setQualityLevel('low')
          }
        })
      })
    }
  }

  /**
   * Optimize scene for current quality level
   */
  optimizeScene() {
    const settings = this.qualityLevels[this.currentQuality]
    let objectCount = 0
    
    this.scene.traverse((object) => {
      if (object.isMesh) {
        objectCount++
        
        // Hide objects beyond limit
        if (objectCount > settings.maxObjects) {
          object.visible = false
          return
        }
        
        // Enable LOD for non-essential objects
        if (!object.userData.essential) {
          object.userData.lodEnabled = true
        }
        
        // Optimize materials
        if (object.material) {
          this.optimizeMaterial(object.material, settings)
        }
      }
    })
    
    console.log(`🎯 Optimized scene: ${objectCount} objects, quality: ${this.currentQuality}`)
  }

  /**
   * Optimize material based on quality settings
   */
  optimizeMaterial(material, settings) {
    if (Array.isArray(material)) {
      material.forEach(mat => this.optimizeMaterial(mat, settings))
      return
    }
    
    // Disable expensive features on low quality
    if (this.currentQuality === 'low') {
      material.transparent = false
      material.alphaTest = 0
      if (material.normalMap) {
        material.normalMap = null
        material.needsUpdate = true
      }
    }
    
    // Adjust shininess/roughness
    if (material.shininess !== undefined) {
      material.shininess = settings.animationQuality === 'high' ? 100 : 30
    }
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics() {
    return {
      fps: this.performanceMonitor.fps,
      averageFPS: this.performanceMonitor.averageFPS,
      memoryUsage: this.performanceMonitor.memoryUsage,
      qualityLevel: this.currentQuality,
      deviceCapabilities: this.deviceCapabilities
    }
  }

  /**
   * Get quality recommendations
   */
  getQualityRecommendations() {
    const recommendations = []
    
    if (this.performanceMonitor.averageFPS < 30) {
      recommendations.push('Considera reducir la calidad gráfica para mejorar el rendimiento')
    }
    
    if (this.performanceMonitor.memoryUsage > this.deviceCapabilities.maxMemory * 0.8) {
      recommendations.push('Memoria alta detectada, cierra otras aplicaciones')
    }
    
    if (this.deviceCapabilities.hasLowPowerMode) {
      recommendations.push('Modo de bajo consumo activo, conecta el cargador para mejor rendimiento')
    }
    
    if (this.deviceCapabilities.isMobile && this.currentQuality === 'high') {
      recommendations.push('En dispositivos móviles, la calidad media ofrece mejor duración de batería')
    }
    
    return recommendations
  }

  /**
   * Force quality level (disable adaptive)
   */
  forceQualityLevel(level) {
    this.adaptiveQuality = false
    this.setQualityLevel(level)
    console.log(`🔒 Quality locked to ${level}`)
  }

  /**
   * Enable adaptive quality
   */
  enableAdaptiveQuality() {
    this.adaptiveQuality = true
    console.log('🔄 Adaptive quality enabled')
  }

  /**
   * Dispose resources
   */
  dispose() {
    // Clear caches
    this.memoryManager.textureCache.forEach(texture => texture.dispose())
    this.memoryManager.geometryCache.forEach(geometry => geometry.dispose())
    this.memoryManager.materialCache.forEach(material => material.dispose())
    
    // Clear maps
    this.memoryManager.textureCache.clear()
    this.memoryManager.geometryCache.clear()
    this.memoryManager.materialCache.clear()
    this.memoryManager.disposedObjects.clear()
    
    console.log('🧹 AR Performance Optimizer disposed')
  }
}
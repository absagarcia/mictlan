/**
 * AR Manager
 * Handles WebXR compatibility detection and AR session management
 */

import { appState } from '../../state/AppState.js'

export class ARManager {
  constructor() {
    this.isSupported = false
    this.capabilities = {
      webxr: false,
      immersiveAR: false,
      domOverlay: false,
      hitTest: false,
      anchors: false
    }
    
    this.deviceInfo = {
      isMobile: false,
      isIOS: false,
      isAndroid: false,
      hasCamera: false,
      hasMotionSensors: false
    }
    
    this.performanceLevel = 'high' // 'high', 'medium', 'low'
    
    this.init()
  }

  /**
   * Initialize AR Manager
   */
  async init() {
    console.log('🔍 Initializing AR Manager...')
    
    // Detect device capabilities
    this.detectDevice()
    
    // Check WebXR support
    await this.checkWebXRSupport()
    
    // Determine performance level
    this.assessPerformance()
    
    // Update app state
    this.updateAppState()
    
    console.log('✅ AR Manager initialized')
    console.log('📱 Device info:', this.deviceInfo)
    console.log('🥽 AR capabilities:', this.capabilities)
    console.log('⚡ Performance level:', this.performanceLevel)
  }

  /**
   * Detect device type and capabilities
   */
  detectDevice() {
    const userAgent = navigator.userAgent.toLowerCase()
    
    // Mobile detection
    this.deviceInfo.isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    this.deviceInfo.isIOS = /iphone|ipad|ipod/i.test(userAgent)
    this.deviceInfo.isAndroid = /android/i.test(userAgent)
    
    // Camera detection
    this.deviceInfo.hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    
    // Motion sensors detection
    this.deviceInfo.hasMotionSensors = !!(
      window.DeviceOrientationEvent || 
      window.DeviceMotionEvent
    )
    
    // Screen size for performance assessment
    this.deviceInfo.screenWidth = window.screen.width
    this.deviceInfo.screenHeight = window.screen.height
    this.deviceInfo.pixelRatio = window.devicePixelRatio || 1
  }

  /**
   * Check WebXR support and capabilities
   */
  async checkWebXRSupport() {
    if (!('xr' in navigator)) {
      console.log('⚠️ WebXR not available')
      return
    }
    
    this.capabilities.webxr = true
    
    try {
      // Check immersive AR support
      this.capabilities.immersiveAR = await navigator.xr.isSessionSupported('immersive-ar')
      
      if (this.capabilities.immersiveAR) {
        // Check additional features
        await this.checkARFeatures()
        this.isSupported = true
      } else {
        console.log('⚠️ Immersive AR not supported')
      }
      
    } catch (error) {
      console.warn('WebXR capability check failed:', error)
    }
  }

  /**
   * Check specific AR features
   */
  async checkARFeatures() {
    try {
      // Test session with optional features
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local'],
        optionalFeatures: ['dom-overlay', 'hit-test', 'anchors']
      })
      
      // Check which features are actually supported
      this.capabilities.domOverlay = session.domOverlayState?.type === 'screen'
      this.capabilities.hitTest = session.inputSources?.some(source => source.targetRayMode === 'tracked-pointer')
      
      // End test session immediately
      await session.end()
      
    } catch (error) {
      console.warn('AR features check failed:', error)
    }
  }

  /**
   * Assess device performance level
   */
  assessPerformance() {
    let score = 0
    
    // Base score from device type
    if (this.deviceInfo.isMobile) {
      score += 30
    } else {
      score += 50 // Desktop generally more powerful
    }
    
    // Screen resolution impact
    const totalPixels = this.deviceInfo.screenWidth * this.deviceInfo.screenHeight * this.deviceInfo.pixelRatio
    if (totalPixels > 2000000) { // > 2MP
      score -= 20
    } else if (totalPixels > 1000000) { // > 1MP
      score -= 10
    }
    
    // Memory estimation (rough)
    if (navigator.deviceMemory) {
      if (navigator.deviceMemory >= 8) {
        score += 30
      } else if (navigator.deviceMemory >= 4) {
        score += 20
      } else if (navigator.deviceMemory >= 2) {
        score += 10
      }
    } else {
      // Fallback estimation
      score += 15
    }
    
    // Hardware concurrency (CPU cores)
    if (navigator.hardwareConcurrency) {
      if (navigator.hardwareConcurrency >= 8) {
        score += 20
      } else if (navigator.hardwareConcurrency >= 4) {
        score += 15
      } else if (navigator.hardwareConcurrency >= 2) {
        score += 10
      }
    } else {
      score += 10
    }
    
    // Connection speed impact
    if (navigator.connection) {
      const effectiveType = navigator.connection.effectiveType
      if (effectiveType === '4g') {
        score += 10
      } else if (effectiveType === '3g') {
        score += 5
      } else if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        score -= 10
      }
    }
    
    // Determine performance level
    if (score >= 80) {
      this.performanceLevel = 'high'
    } else if (score >= 50) {
      this.performanceLevel = 'medium'
    } else {
      this.performanceLevel = 'low'
    }
  }

  /**
   * Get recommended settings based on performance level
   */
  getRecommendedSettings() {
    const settings = {
      high: {
        shadowMapSize: 2048,
        antialias: true,
        pixelRatio: Math.min(window.devicePixelRatio, 2),
        maxMemorials: 20,
        animationQuality: 'high',
        textureQuality: 'high',
        particleCount: 100
      },
      medium: {
        shadowMapSize: 1024,
        antialias: true,
        pixelRatio: Math.min(window.devicePixelRatio, 1.5),
        maxMemorials: 15,
        animationQuality: 'medium',
        textureQuality: 'medium',
        particleCount: 50
      },
      low: {
        shadowMapSize: 512,
        antialias: false,
        pixelRatio: 1,
        maxMemorials: 10,
        animationQuality: 'low',
        textureQuality: 'low',
        particleCount: 25
      }
    }
    
    return settings[this.performanceLevel]
  }

  /**
   * Update app state with AR information
   */
  updateAppState() {
    appState.set('arSession.isSupported', this.isSupported)
    appState.set('arSession.capabilities', this.capabilities)
    appState.set('arSession.deviceInfo', this.deviceInfo)
    appState.set('arSession.performanceLevel', this.performanceLevel)
  }

  /**
   * Request AR session with optimal settings
   */
  async requestARSession(options = {}) {
    if (!this.isSupported) {
      throw new Error('AR not supported on this device')
    }
    
    const defaultOptions = {
      requiredFeatures: ['local'],
      optionalFeatures: []
    }
    
    // Add optional features based on capabilities
    if (this.capabilities.domOverlay) {
      defaultOptions.optionalFeatures.push('dom-overlay')
      if (options.domOverlay) {
        defaultOptions.domOverlay = options.domOverlay
      }
    }
    
    if (this.capabilities.hitTest) {
      defaultOptions.optionalFeatures.push('hit-test')
    }
    
    if (this.capabilities.anchors) {
      defaultOptions.optionalFeatures.push('anchors')
    }
    
    const sessionOptions = { ...defaultOptions, ...options }
    
    try {
      const session = await navigator.xr.requestSession('immersive-ar', sessionOptions)
      console.log('✅ AR session created with features:', session.enabledFeatures)
      return session
    } catch (error) {
      console.error('❌ Failed to create AR session:', error)
      throw error
    }
  }

  /**
   * Check if AR is currently available
   */
  async isARAvailable() {
    if (!this.capabilities.webxr) {
      return false
    }
    
    try {
      return await navigator.xr.isSessionSupported('immersive-ar')
    } catch (error) {
      return false
    }
  }

  /**
   * Get fallback options when AR is not available
   */
  getFallbackOptions() {
    return {
      use3D: true,
      enableGyroscope: this.deviceInfo.hasMotionSensors,
      enableTouch: this.deviceInfo.isMobile,
      message: this.getARUnavailableMessage()
    }
  }

  /**
   * Get appropriate message for AR unavailability
   */
  getARUnavailableMessage() {
    if (!this.capabilities.webxr) {
      return 'Tu navegador no soporta WebXR. Usa Chrome o Edge en Android, o Safari en iOS 14.5+'
    }
    
    if (!this.capabilities.immersiveAR) {
      return 'La realidad aumentada no está disponible en este dispositivo. Disfruta la experiencia 3D'
    }
    
    if (!this.deviceInfo.hasCamera) {
      return 'Se requiere acceso a la cámara para la realidad aumentada'
    }
    
    return 'La realidad aumentada no está disponible en este momento'
  }

  /**
   * Monitor performance during AR session
   */
  startPerformanceMonitoring(renderer) {
    if (!renderer) return
    
    const monitor = {
      frameCount: 0,
      lastTime: performance.now(),
      fps: 60,
      memoryUsage: 0
    }
    
    const checkPerformance = () => {
      monitor.frameCount++
      const currentTime = performance.now()
      
      if (currentTime - monitor.lastTime >= 1000) {
        monitor.fps = monitor.frameCount
        monitor.frameCount = 0
        monitor.lastTime = currentTime
        
        // Check memory usage if available
        if (performance.memory) {
          monitor.memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024 // MB
        }
        
        // Adjust quality if performance is poor
        if (monitor.fps < 30 && this.performanceLevel !== 'low') {
          console.warn('⚠️ Poor performance detected, reducing quality')
          this.performanceLevel = 'low'
          this.updateAppState()
          
          // Dispatch event for components to adjust
          window.dispatchEvent(new CustomEvent('ar-performance-adjust', {
            detail: { level: 'low', fps: monitor.fps }
          }))
        }
        
        // Log performance metrics
        console.log(`📊 AR Performance: ${monitor.fps} FPS, ${monitor.memoryUsage.toFixed(1)} MB`)
      }
    }
    
    renderer.setAnimationLoop(checkPerformance)
    
    return monitor
  }

  /**
   * Get device-specific recommendations
   */
  getDeviceRecommendations() {
    const recommendations = []
    
    if (this.deviceInfo.isIOS) {
      recommendations.push('Para mejor experiencia AR, usa Safari en iOS 14.5 o superior')
    }
    
    if (this.deviceInfo.isAndroid) {
      recommendations.push('Para mejor experiencia AR, usa Chrome en Android 8.0 o superior')
    }
    
    if (this.performanceLevel === 'low') {
      recommendations.push('Cierra otras aplicaciones para mejorar el rendimiento')
      recommendations.push('Considera reducir la calidad gráfica en configuración')
    }
    
    if (!this.deviceInfo.hasCamera) {
      recommendations.push('Se requiere cámara para funciones de realidad aumentada')
    }
    
    return recommendations
  }

  /**
   * Test AR functionality
   */
  async testARFunctionality() {
    const results = {
      webxr: this.capabilities.webxr,
      immersiveAR: false,
      sessionCreation: false,
      cameraAccess: false,
      error: null
    }
    
    try {
      if (this.capabilities.webxr) {
        results.immersiveAR = await navigator.xr.isSessionSupported('immersive-ar')
        
        if (results.immersiveAR) {
          // Test session creation
          const session = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['local']
          })
          results.sessionCreation = true
          await session.end()
          
          // Test camera access
          if (navigator.mediaDevices) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            results.cameraAccess = true
            stream.getTracks().forEach(track => track.stop())
          }
        }
      }
    } catch (error) {
      results.error = error.message
      console.warn('AR functionality test failed:', error)
    }
    
    return results
  }
}

// Create singleton instance
export const arManager = new ARManager()
/**
 * AR Service
 * Integrates all AR components and provides a unified interface
 */

import { ARAltarComponent } from '../components/ar/ARAltarComponent.js'
import { ARManager, arManager } from '../components/ar/ARManager.js'
import { WebXRPolyfill, webXRPolyfill } from '../components/ar/WebXRPolyfill.js'
import { InteractiveAltarElements } from '../components/ar/InteractiveAltarElements.js'
import { VirtualOfferingsComponent } from '../components/ar/VirtualOfferingsComponent.js'
import { ARPerformanceOptimizer } from '../components/ar/ARPerformanceOptimizer.js'
import { appState } from '../state/AppState.js'

export class ARService {
  constructor() {
    this.isInitialized = false
    this.isARActive = false
    
    // Core components
    this.altarComponent = null
    this.interactiveElements = null
    this.offeringsComponent = null
    this.performanceOptimizer = null
    
    // AR session management
    this.xrSession = null
    this.xrReferenceSpace = null
    
    // Event handlers
    this.eventHandlers = new Map()
    
    this.init()
  }

  /**
   * Initialize AR Service
   */
  async init() {
    if (this.isInitialized) return

    console.log('🚀 Initializing AR Service...')

    try {
      // Initialize AR Manager first
      await arManager.init()
      
      // Initialize WebXR polyfill if needed
      const polyfillNeeded = await webXRPolyfill.init()
      if (polyfillNeeded) {
        console.log('🔧 WebXR polyfill active')
      }
      
      // Setup event listeners
      this.setupEventListeners()
      
      this.isInitialized = true
      console.log('✅ AR Service initialized')
      
    } catch (error) {
      console.error('❌ Failed to initialize AR Service:', error)
      throw error
    }
  }

  /**
   * Create AR altar experience
   */
  async createAltarExperience(container, memoryData = []) {
    if (!this.isInitialized) {
      await this.init()
    }

    console.log('🏛️ Creating AR altar experience...')

    try {
      // Create main altar component
      this.altarComponent = new ARAltarComponent(container, memoryData)
      await this.altarComponent.init()
      
      // Initialize performance optimizer
      this.performanceOptimizer = new ARPerformanceOptimizer(
        this.altarComponent.renderer,
        this.altarComponent.scene,
        this.altarComponent.camera
      )
      await this.performanceOptimizer.init()
      
      // Create interactive elements
      this.interactiveElements = new InteractiveAltarElements(
        this.altarComponent.scene,
        this.altarComponent.altarGroup,
        this.altarComponent.camera
      )
      
      // Create virtual offerings system
      this.offeringsComponent = new VirtualOfferingsComponent(
        this.altarComponent.scene,
        this.altarComponent.altarGroup,
        this.altarComponent.camera
      )
      await this.offeringsComponent.init()
      
      // Setup integrated interactions
      this.setupIntegratedInteractions()
      
      // Load existing offerings if any
      const existingOfferings = appState.get('arSession.offerings') || []
      if (existingOfferings.length > 0) {
        this.offeringsComponent.loadOfferings(existingOfferings)
      }
      
      console.log('✅ AR altar experience created')
      
      return {
        altar: this.altarComponent,
        interactive: this.interactiveElements,
        offerings: this.offeringsComponent,
        performance: this.performanceOptimizer
      }
      
    } catch (error) {
      console.error('❌ Failed to create AR altar experience:', error)
      throw error
    }
  }

  /**
   * Setup integrated interactions between components
   */
  setupIntegratedInteractions() {
    // Handle altar level interactions
    this.altarComponent.container.addEventListener('altar-level-selected', (event) => {
      const { level, levelData } = event.detail
      this.interactiveElements.onLevelInteraction(level)
    })
    
    // Handle memorial interactions
    this.altarComponent.container.addEventListener('memorial-selected', (event) => {
      const { memorial } = event.detail
      this.showMemorialDetails(memorial)
    })
    
    // Handle offering placement
    document.addEventListener('place-offering-for-memorial', (event) => {
      const { offeringType, memorial } = event.detail
      this.offeringsComponent.startPlacementMode(offeringType, memorial.id)
    })
    
    // Handle quality changes
    document.addEventListener('quality-level-changed', (event) => {
      const { newLevel, settings } = event.detail
      this.onQualityLevelChanged(newLevel, settings)
    })
    
    // Handle performance adjustments
    window.addEventListener('ar-performance-adjust', (event) => {
      const { level, fps } = event.detail
      this.onPerformanceAdjust(level, fps)
    })
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // AR session events
    this.eventHandlers.set('ar-session-start', this.onARSessionStart.bind(this))
    this.eventHandlers.set('ar-session-end', this.onARSessionEnd.bind(this))
    
    // Memorial events
    this.eventHandlers.set('memorial-added', this.onMemorialAdded.bind(this))
    this.eventHandlers.set('memorial-updated', this.onMemorialUpdated.bind(this))
    this.eventHandlers.set('memorial-removed', this.onMemorialRemoved.bind(this))
    
    // Register event listeners
    this.eventHandlers.forEach((handler, event) => {
      document.addEventListener(event, handler)
    })
  }

  /**
   * Start AR session
   */
  async startARSession() {
    if (this.isARActive || !this.altarComponent) {
      return false
    }

    try {
      console.log('🥽 Starting AR session...')
      
      // Check AR availability
      const isAvailable = await arManager.isARAvailable()
      if (!isAvailable) {
        console.log('⚠️ AR not available, using 3D fallback')
        this.start3DFallback()
        return false
      }
      
      // Request AR session
      this.xrSession = await arManager.requestARSession({
        domOverlay: { root: this.altarComponent.container }
      })
      
      // Setup XR session
      this.altarComponent.renderer.xr.setSession(this.xrSession)
      this.xrReferenceSpace = await this.xrSession.requestReferenceSpace('local')
      
      // Handle session end
      this.xrSession.addEventListener('end', () => {
        this.endARSession()
      })
      
      this.isARActive = true
      appState.actions.startARSession()
      
      // Start performance monitoring
      this.performanceOptimizer.startPerformanceMonitoring(this.altarComponent.renderer)
      
      console.log('✅ AR session started')
      return true
      
    } catch (error) {
      console.error('❌ Failed to start AR session:', error)
      
      // Fallback to 3D mode
      this.start3DFallback()
      return false
    }
  }

  /**
   * End AR session
   */
  async endARSession() {
    if (!this.isARActive) return

    try {
      if (this.xrSession) {
        await this.xrSession.end()
      }
      
      this.xrSession = null
      this.xrReferenceSpace = null
      this.isARActive = false
      
      appState.actions.endARSession()
      
      console.log('👋 AR session ended')
      
    } catch (error) {
      console.error('❌ Error ending AR session:', error)
    }
  }

  /**
   * Start 3D fallback mode
   */
  start3DFallback() {
    console.log('🎮 Starting 3D fallback mode...')
    
    if (this.altarComponent) {
      const fallbackOptions = arManager.getFallbackOptions()
      
      // Setup 3D controls
      const fallback = webXRPolyfill.create3DFallback(
        this.altarComponent.scene,
        this.altarComponent.camera,
        this.altarComponent.renderer
      )
      
      // Show fallback message
      appState.actions.showNotification({
        type: 'info',
        title: 'Modo 3D Activo',
        message: fallbackOptions.message
      })
      
      // Update app state
      appState.set('arSession.isFallback', true)
    }
  }

  /**
   * Add memorial to altar
   */
  addMemorial(memorial) {
    if (this.altarComponent) {
      this.altarComponent.addMemorial(memorial)
    }
    
    if (this.interactiveElements) {
      this.interactiveElements.addMemorialPhoto(memorial, memorial.altarLevel || 'tierra')
    }
  }

  /**
   * Update memorial
   */
  updateMemorial(memorial) {
    if (this.altarComponent) {
      this.altarComponent.updateMemorial(memorial)
    }
    
    if (this.interactiveElements) {
      this.interactiveElements.updateMemorial(memorial)
    }
  }

  /**
   * Remove memorial
   */
  removeMemorial(memorialId) {
    if (this.altarComponent) {
      this.altarComponent.removeMemorial(memorialId)
    }
    
    if (this.interactiveElements) {
      this.interactiveElements.removeMemorial(memorialId)
    }
    
    // Remove associated offerings
    if (this.offeringsComponent) {
      const offerings = this.offeringsComponent.getOfferingsForMemorial(memorialId)
      offerings.forEach(offering => {
        this.offeringsComponent.removeOffering(offering.id)
      })
    }
  }

  /**
   * Show memorial details
   */
  showMemorialDetails(memorial) {
    // Get associated offerings
    const offerings = this.offeringsComponent ? 
      this.offeringsComponent.getOfferingsForMemorial(memorial.id) : []
    
    // Dispatch event for UI
    const event = new CustomEvent('show-memorial-details', {
      detail: { 
        memorial, 
        offerings,
        canPlaceOfferings: !!this.offeringsComponent
      }
    })
    document.dispatchEvent(event)
  }

  /**
   * Get offering catalog
   */
  getOfferingCatalog() {
    return this.offeringsComponent ? this.offeringsComponent.getCatalog() : []
  }

  /**
   * Place offering for memorial
   */
  placeOfferingForMemorial(offeringType, memorial) {
    if (this.offeringsComponent) {
      this.offeringsComponent.startPlacementMode(offeringType, memorial.id)
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return this.performanceOptimizer ? 
      this.performanceOptimizer.getPerformanceMetrics() : null
  }

  /**
   * Set quality level
   */
  setQualityLevel(level) {
    if (this.performanceOptimizer) {
      this.performanceOptimizer.setQualityLevel(level)
    }
  }

  /**
   * Reset camera view
   */
  resetCameraView() {
    if (this.interactiveElements) {
      this.interactiveElements.resetCameraView()
    }
  }

  /**
   * Event handlers
   */
  onARSessionStart(event) {
    console.log('📡 AR session start event received')
  }

  onARSessionEnd(event) {
    console.log('📡 AR session end event received')
  }

  onMemorialAdded(event) {
    const { memorial } = event.detail
    this.addMemorial(memorial)
  }

  onMemorialUpdated(event) {
    const { memorial } = event.detail
    this.updateMemorial(memorial)
  }

  onMemorialRemoved(event) {
    const { memorialId } = event.detail
    this.removeMemorial(memorialId)
  }

  onQualityLevelChanged(newLevel, settings) {
    console.log(`🎚️ Quality level changed to ${newLevel}`)
    
    // Notify user of quality change
    appState.actions.showNotification({
      type: 'info',
      title: 'Calidad Ajustada',
      message: `Calidad gráfica cambiada a ${newLevel} para mejor rendimiento`
    })
  }

  onPerformanceAdjust(level, fps) {
    console.log(`⚡ Performance adjusted to ${level} (${fps} FPS)`)
    
    // Show performance warning if needed
    if (fps < 20) {
      appState.actions.showNotification({
        type: 'warning',
        title: 'Rendimiento Bajo',
        message: 'Considera cerrar otras aplicaciones para mejorar la experiencia'
      })
    }
  }

  /**
   * Get AR status
   */
  getARStatus() {
    return {
      isInitialized: this.isInitialized,
      isARActive: this.isARActive,
      isSupported: arManager.isSupported,
      capabilities: arManager.capabilities,
      deviceInfo: arManager.deviceInfo,
      performanceLevel: arManager.performanceLevel,
      isFallback: appState.get('arSession.isFallback') || false
    }
  }

  /**
   * Dispose AR service
   */
  dispose() {
    console.log('🧹 Disposing AR Service...')
    
    // End AR session if active
    if (this.isARActive) {
      this.endARSession()
    }
    
    // Dispose components
    if (this.altarComponent) {
      this.altarComponent.dispose()
    }
    
    if (this.interactiveElements) {
      this.interactiveElements.dispose()
    }
    
    if (this.offeringsComponent) {
      this.offeringsComponent.dispose()
    }
    
    if (this.performanceOptimizer) {
      this.performanceOptimizer.dispose()
    }
    
    // Remove event listeners
    this.eventHandlers.forEach((handler, event) => {
      document.removeEventListener(event, handler)
    })
    
    this.eventHandlers.clear()
    
    console.log('✅ AR Service disposed')
  }
}

// Create singleton instance
export const arService = new ARService()
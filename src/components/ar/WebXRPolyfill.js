/**
 * WebXR Polyfill Service
 * Provides fallback functionality for devices without native WebXR support
 */

import * as THREE from 'three'

export class WebXRPolyfill {
  constructor() {
    this.isPolyfillActive = false
    this.deviceOrientation = null
    this.deviceMotion = null
    this.touchControls = null
    this.gyroscopeControls = null
  }

  /**
   * Initialize polyfill if needed
   */
  async init() {
    // Check if native WebXR is available
    if ('xr' in navigator) {
      try {
        const supported = await navigator.xr.isSessionSupported('immersive-ar')
        if (supported) {
          console.log('✅ Native WebXR available, polyfill not needed')
          return false
        }
      } catch (error) {
        console.log('⚠️ WebXR check failed, enabling polyfill')
      }
    }
    
    console.log('🔧 Initializing WebXR polyfill...')
    this.isPolyfillActive = true
    
    // Setup device orientation controls
    this.setupDeviceOrientation()
    
    // Setup touch controls for mobile
    this.setupTouchControls()
    
    // Create mock XR API
    this.createMockXRAPI()
    
    console.log('✅ WebXR polyfill initialized')
    return true
  }

  /**
   * Setup device orientation controls
   */
  setupDeviceOrientation() {
    if (!window.DeviceOrientationEvent) {
      console.log('⚠️ Device orientation not available')
      return
    }
    
    this.deviceOrientation = {
      alpha: 0, // Z axis rotation
      beta: 0,  // X axis rotation
      gamma: 0  // Y axis rotation
    }
    
    // Request permission on iOS
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            this.enableDeviceOrientation()
          }
        })
        .catch(console.error)
    } else {
      this.enableDeviceOrientation()
    }
  }

  /**
   * Enable device orientation tracking
   */
  enableDeviceOrientation() {
    window.addEventListener('deviceorientation', (event) => {
      this.deviceOrientation.alpha = event.alpha || 0
      this.deviceOrientation.beta = event.beta || 0
      this.deviceOrientation.gamma = event.gamma || 0
    })
    
    console.log('📱 Device orientation tracking enabled')
  }

  /**
   * Setup touch controls for mobile devices
   */
  setupTouchControls() {
    this.touchControls = {
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isActive: false
    }
    
    // Touch event handlers will be attached to specific elements
    console.log('👆 Touch controls initialized')
  }

  /**
   * Create mock XR API for compatibility
   */
  createMockXRAPI() {
    if ('xr' in navigator) return
    
    // Create minimal XR API mock
    navigator.xr = {
      isSessionSupported: async (mode) => {
        return mode === 'immersive-ar' && this.isPolyfillActive
      },
      
      requestSession: async (mode, options) => {
        if (mode !== 'immersive-ar') {
          throw new Error('Only immersive-ar mode supported in polyfill')
        }
        
        return new MockXRSession(options)
      }
    }
    
    console.log('🔧 Mock XR API created')
  }

  /**
   * Apply device orientation to camera
   */
  applyDeviceOrientationToCamera(camera) {
    if (!this.deviceOrientation) return
    
    const { alpha, beta, gamma } = this.deviceOrientation
    
    // Convert device orientation to camera rotation
    const euler = new THREE.Euler(
      THREE.MathUtils.degToRad(beta),
      THREE.MathUtils.degToRad(alpha),
      THREE.MathUtils.degToRad(gamma),
      'YXZ'
    )
    
    camera.quaternion.setFromEuler(euler)
  }

  /**
   * Setup touch controls for a specific element
   */
  setupTouchControlsForElement(element, camera) {
    let startRotationX = 0
    let startRotationY = 0
    
    const onTouchStart = (event) => {
      event.preventDefault()
      const touch = event.touches[0]
      this.touchControls.startX = touch.clientX
      this.touchControls.startY = touch.clientY
      this.touchControls.isActive = true
      
      // Store initial camera rotation
      startRotationX = camera.rotation.x
      startRotationY = camera.rotation.y
    }
    
    const onTouchMove = (event) => {
      if (!this.touchControls.isActive) return
      
      event.preventDefault()
      const touch = event.touches[0]
      this.touchControls.currentX = touch.clientX
      this.touchControls.currentY = touch.clientY
      
      // Calculate rotation delta
      const deltaX = (this.touchControls.currentX - this.touchControls.startX) * 0.01
      const deltaY = (this.touchControls.currentY - this.touchControls.startY) * 0.01
      
      // Apply rotation to camera
      camera.rotation.y = startRotationY - deltaX
      camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, startRotationX - deltaY))
    }
    
    const onTouchEnd = (event) => {
      event.preventDefault()
      this.touchControls.isActive = false
    }
    
    element.addEventListener('touchstart', onTouchStart, { passive: false })
    element.addEventListener('touchmove', onTouchMove, { passive: false })
    element.addEventListener('touchend', onTouchEnd, { passive: false })
    
    return {
      dispose: () => {
        element.removeEventListener('touchstart', onTouchStart)
        element.removeEventListener('touchmove', onTouchMove)
        element.removeEventListener('touchend', onTouchEnd)
      }
    }
  }

  /**
   * Create 3D fallback experience
   */
  create3DFallback(scene, camera, renderer) {
    console.log('🎮 Creating 3D fallback experience...')
    
    // Add orbit controls for desktop
    if (!this.isMobileDevice()) {
      this.setupOrbitControls(camera, renderer.domElement)
    } else {
      // Use device orientation + touch for mobile
      this.setupMobileControls(camera, renderer.domElement)
    }
    
    // Add helpful UI indicators
    this.addFallbackUI(renderer.domElement.parentElement)
    
    return {
      isAR: false,
      controls: this.touchControls || this.orbitControls,
      dispose: () => {
        if (this.orbitControls) this.orbitControls.dispose()
        if (this.touchControlsDisposer) this.touchControlsDisposer.dispose()
      }
    }
  }

  /**
   * Setup orbit controls for desktop
   */
  setupOrbitControls(camera, domElement) {
    // Simple orbit controls implementation
    this.orbitControls = {
      target: new THREE.Vector3(0, 1.5, 0),
      minDistance: 2,
      maxDistance: 10,
      enablePan: false,
      enableZoom: true,
      enableRotate: true,
      
      dispose: () => {
        // Cleanup event listeners
      }
    }
    
    // Mouse controls
    let isMouseDown = false
    let mouseX = 0
    let mouseY = 0
    let phi = 0
    let theta = Math.PI / 2
    
    const onMouseDown = (event) => {
      isMouseDown = true
      mouseX = event.clientX
      mouseY = event.clientY
    }
    
    const onMouseMove = (event) => {
      if (!isMouseDown) return
      
      const deltaX = event.clientX - mouseX
      const deltaY = event.clientY - mouseY
      
      theta -= deltaX * 0.01
      phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi + deltaY * 0.01))
      
      // Update camera position
      const radius = 5
      camera.position.x = radius * Math.sin(phi) * Math.cos(theta)
      camera.position.y = radius * Math.cos(phi) + 1.5
      camera.position.z = radius * Math.sin(phi) * Math.sin(theta)
      
      camera.lookAt(this.orbitControls.target)
      
      mouseX = event.clientX
      mouseY = event.clientY
    }
    
    const onMouseUp = () => {
      isMouseDown = false
    }
    
    const onWheel = (event) => {
      const scale = event.deltaY > 0 ? 1.1 : 0.9
      camera.position.multiplyScalar(scale)
      
      // Clamp distance
      const distance = camera.position.distanceTo(this.orbitControls.target)
      if (distance < this.orbitControls.minDistance || distance > this.orbitControls.maxDistance) {
        camera.position.normalize().multiplyScalar(
          Math.max(this.orbitControls.minDistance, Math.min(this.orbitControls.maxDistance, distance))
        )
      }
    }
    
    domElement.addEventListener('mousedown', onMouseDown)
    domElement.addEventListener('mousemove', onMouseMove)
    domElement.addEventListener('mouseup', onMouseUp)
    domElement.addEventListener('wheel', onWheel)
    
    this.orbitControls.dispose = () => {
      domElement.removeEventListener('mousedown', onMouseDown)
      domElement.removeEventListener('mousemove', onMouseMove)
      domElement.removeEventListener('mouseup', onMouseUp)
      domElement.removeEventListener('wheel', onWheel)
    }
  }

  /**
   * Setup mobile controls
   */
  setupMobileControls(camera, domElement) {
    // Combine device orientation with touch controls
    this.touchControlsDisposer = this.setupTouchControlsForElement(domElement, camera)
    
    // Apply device orientation if available
    if (this.deviceOrientation) {
      const updateOrientation = () => {
        this.applyDeviceOrientationToCamera(camera)
        requestAnimationFrame(updateOrientation)
      }
      updateOrientation()
    }
  }

  /**
   * Add fallback UI indicators
   */
  addFallbackUI(container) {
    const fallbackInfo = document.createElement('div')
    fallbackInfo.className = 'ar-fallback-info'
    fallbackInfo.innerHTML = `
      <div class="fallback-message">
        <p>🎮 Modo 3D Activado</p>
        <small>${this.isMobileDevice() ? 'Mueve tu dispositivo o toca para explorar' : 'Usa el mouse para explorar el altar'}</small>
      </div>
    `
    
    container.appendChild(fallbackInfo)
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      fallbackInfo.style.opacity = '0'
      setTimeout(() => {
        if (fallbackInfo.parentNode) {
          fallbackInfo.parentNode.removeChild(fallbackInfo)
        }
      }, 500)
    }, 3000)
  }

  /**
   * Check if device is mobile
   */
  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  /**
   * Get polyfill status
   */
  getStatus() {
    return {
      isActive: this.isPolyfillActive,
      hasDeviceOrientation: !!this.deviceOrientation,
      hasTouchControls: !!this.touchControls,
      isMobile: this.isMobileDevice()
    }
  }
}

/**
 * Mock XR Session for polyfill
 */
class MockXRSession {
  constructor(options = {}) {
    this.mode = 'immersive-ar'
    this.enabledFeatures = ['local']
    this.domOverlayState = options.domOverlay ? { type: 'screen' } : null
    this.inputSources = []
    this.ended = false
    
    // Event handling
    this.eventListeners = new Map()
  }

  addEventListener(type, listener) {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set())
    }
    this.eventListeners.get(type).add(listener)
  }

  removeEventListener(type, listener) {
    const listeners = this.eventListeners.get(type)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  dispatchEvent(event) {
    const listeners = this.eventListeners.get(event.type)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error('Event listener error:', error)
        }
      })
    }
  }

  async requestReferenceSpace(type) {
    if (type !== 'local') {
      throw new Error('Only local reference space supported in polyfill')
    }
    
    return new MockXRReferenceSpace()
  }

  async end() {
    if (this.ended) return
    
    this.ended = true
    this.dispatchEvent({ type: 'end' })
  }
}

/**
 * Mock XR Reference Space
 */
class MockXRReferenceSpace {
  constructor() {
    this.transform = {
      position: { x: 0, y: 0, z: 0 },
      orientation: { x: 0, y: 0, z: 0, w: 1 }
    }
  }
}

// Create singleton instance
export const webXRPolyfill = new WebXRPolyfill()
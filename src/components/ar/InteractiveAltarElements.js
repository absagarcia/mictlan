/**
 * Interactive Altar Elements
 * Handles clickable altar levels, smooth animations, and memorial photo integration
 */

import * as THREE from 'three'
import { appState } from '../../state/AppState.js'

export class InteractiveAltarElements {
  constructor(scene, altarGroup, camera) {
    this.scene = scene
    this.altarGroup = altarGroup
    this.camera = camera
    
    // Animation system
    this.animationMixer = null
    this.activeAnimations = new Map()
    this.clock = new THREE.Clock()
    
    // Interactive elements
    this.levelElements = new Map()
    this.memorialFrames = new Map()
    this.highlightMaterials = new Map()
    
    // Animation states
    this.currentFocusLevel = null
    this.isAnimating = false
    
    // Educational content data
    this.levelContent = {
      tierra: {
        name: 'Nivel Terrenal',
        description: 'Representa la vida en la Tierra y los elementos materiales',
        offerings: ['Agua', 'Sal', 'Pan de muerto', 'Comida favorita'],
        meaning: 'Este nivel simboliza la vida terrenal y los placeres mundanos que disfrutaron nuestros seres queridos.',
        cocoReference: 'Como en Coco, aquí colocamos las cosas que más les gustaban en vida.'
      },
      purgatorio: {
        name: 'Nivel Purgatorio',
        description: 'El paso intermedio entre la vida y la muerte',
        offerings: ['Flores de cempasúchil', 'Incienso', 'Velas'],
        meaning: 'Representa la transición del alma, el camino que recorren nuestros difuntos.',
        cocoReference: 'Es el puente entre el mundo de los vivos y los muertos, como el puente de cempasúchil en Coco.'
      },
      cielo: {
        name: 'Nivel Celestial',
        description: 'El descanso eterno y la conexión espiritual',
        offerings: ['Fotografías', 'Objetos personales', 'Cruces o símbolos religiosos'],
        meaning: 'Aquí habitan las almas en paz, desde donde nos cuidan y protegen.',
        cocoReference: 'Como la Tierra de los Muertos en Coco, donde nuestros ancestros viven mientras los recordamos.'
      }
    }
    
    this.init()
  }

  /**
   * Initialize interactive elements
   */
  init() {
    console.log('🎯 Initializing interactive altar elements...')
    
    // Setup animation mixer
    this.setupAnimationMixer()
    
    // Create interactive level elements
    this.createLevelElements()
    
    // Setup hover effects
    this.setupHoverEffects()
    
    // Setup smooth transitions
    this.setupTransitions()
    
    console.log('✅ Interactive altar elements initialized')
  }

  /**
   * Setup animation mixer
   */
  setupAnimationMixer() {
    this.animationMixer = new THREE.AnimationMixer(this.altarGroup)
    
    // Start animation loop
    const animate = () => {
      const delta = this.clock.getDelta()
      if (this.animationMixer) {
        this.animationMixer.update(delta)
      }
      requestAnimationFrame(animate)
    }
    animate()
  }

  /**
   * Create interactive elements for each level
   */
  createLevelElements() {
    const levels = ['tierra', 'purgatorio', 'cielo']
    const levelHeights = [0, 1.5, 3]
    
    levels.forEach((levelName, index) => {
      const levelY = levelHeights[index]
      
      // Create invisible interaction zone
      const interactionGeometry = new THREE.BoxGeometry(4.2, 0.5, 3.2)
      const interactionMaterial = new THREE.MeshBasicMaterial({ 
        transparent: true, 
        opacity: 0,
        visible: false
      })
      const interactionZone = new THREE.Mesh(interactionGeometry, interactionMaterial)
      interactionZone.position.set(0, levelY + 0.25, 0)
      interactionZone.userData = {
        type: 'altar-level',
        level: levelName,
        interactive: true
      }
      
      this.altarGroup.add(interactionZone)
      this.levelElements.set(levelName, interactionZone)
      
      // Create highlight effect
      this.createLevelHighlight(levelName, levelY)
      
      // Create level indicator
      this.createLevelIndicator(levelName, levelY)
    })
  }

  /**
   * Create highlight effect for level
   */
  createLevelHighlight(levelName, y) {
    // Glowing outline effect
    const highlightGeometry = new THREE.RingGeometry(1.8, 2.2, 32)
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFAA00,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    })
    
    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial)
    highlight.rotation.x = -Math.PI / 2
    highlight.position.set(0, y + 0.01, 0)
    highlight.visible = false
    
    this.altarGroup.add(highlight)
    this.highlightMaterials.set(levelName, highlight)
  }

  /**
   * Create level indicator
   */
  createLevelIndicator(levelName, y) {
    // Create floating text indicator
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = 512
    canvas.height = 128
    
    // Draw background
    context.fillStyle = 'rgba(0, 0, 0, 0.7)'
    context.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw text
    context.fillStyle = '#FFD700'
    context.font = 'bold 32px Arial'
    context.textAlign = 'center'
    context.fillText(this.levelContent[levelName].name, canvas.width / 2, 50)
    
    context.fillStyle = '#FFFFFF'
    context.font = '18px Arial'
    context.fillText('Toca para explorar', canvas.width / 2, 85)
    
    // Create texture and material
    const texture = new THREE.CanvasTexture(canvas)
    const indicatorMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.8
    })
    
    const indicatorGeometry = new THREE.PlaneGeometry(2, 0.5)
    const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial)
    indicator.position.set(0, y + 1, 2.5)
    indicator.lookAt(this.camera.position)
    
    this.altarGroup.add(indicator)
  }

  /**
   * Setup hover effects
   */
  setupHoverEffects() {
    // Floating animation for level indicators
    this.altarGroup.children.forEach(child => {
      if (child.material && child.material.map && child.material.map.image) {
        // Add floating animation
        const originalY = child.position.y
        const floatAnimation = () => {
          const time = Date.now() * 0.001
          child.position.y = originalY + Math.sin(time * 2) * 0.1
          child.rotation.y = Math.sin(time) * 0.1
        }
        
        // Store animation function for cleanup
        child.userData.floatAnimation = floatAnimation
        
        // Start animation
        const animate = () => {
          if (child.parent) {
            floatAnimation()
            requestAnimationFrame(animate)
          }
        }
        animate()
      }
    })
  }

  /**
   * Setup smooth transitions
   */
  setupTransitions() {
    // Create transition curves for smooth camera movement
    this.transitionCurves = new Map()
    
    const levels = ['tierra', 'purgatorio', 'cielo']
    const levelPositions = [
      new THREE.Vector3(0, 2, 5),    // tierra
      new THREE.Vector3(0, 3, 4),   // purgatorio  
      new THREE.Vector3(0, 5, 3)    // cielo
    ]
    
    levels.forEach((level, index) => {
      this.transitionCurves.set(level, {
        position: levelPositions[index],
        lookAt: new THREE.Vector3(0, index * 1.5, 0)
      })
    })
  }

  /**
   * Handle level interaction
   */
  onLevelInteraction(levelName) {
    if (this.isAnimating) return
    
    console.log(`🎯 Level interaction: ${levelName}`)
    
    // Show level highlight
    this.showLevelHighlight(levelName)
    
    // Animate camera to focus on level
    this.focusOnLevel(levelName)
    
    // Show educational content
    this.showEducationalContent(levelName)
    
    // Update app state
    appState.set('ui.currentLevel', levelName)
  }

  /**
   * Show level highlight effect
   */
  showLevelHighlight(levelName) {
    // Hide all highlights first
    this.highlightMaterials.forEach((highlight, name) => {
      if (name !== levelName) {
        this.hideHighlight(name)
      }
    })
    
    // Show selected level highlight
    const highlight = this.highlightMaterials.get(levelName)
    if (highlight) {
      highlight.visible = true
      
      // Animate highlight appearance
      const targetOpacity = 0.6
      const animateHighlight = () => {
        if (highlight.material.opacity < targetOpacity) {
          highlight.material.opacity += 0.02
          requestAnimationFrame(animateHighlight)
        }
      }
      animateHighlight()
      
      // Pulsing effect
      const pulse = () => {
        if (highlight.visible) {
          const time = Date.now() * 0.003
          highlight.material.opacity = targetOpacity + Math.sin(time) * 0.2
          highlight.scale.setScalar(1 + Math.sin(time * 2) * 0.1)
          requestAnimationFrame(pulse)
        }
      }
      pulse()
    }
  }

  /**
   * Hide level highlight
   */
  hideHighlight(levelName) {
    const highlight = this.highlightMaterials.get(levelName)
    if (highlight) {
      const fadeOut = () => {
        if (highlight.material.opacity > 0) {
          highlight.material.opacity -= 0.05
          requestAnimationFrame(fadeOut)
        } else {
          highlight.visible = false
          highlight.scale.setScalar(1)
        }
      }
      fadeOut()
    }
  }

  /**
   * Focus camera on specific level with smooth animation
   */
  focusOnLevel(levelName) {
    if (this.isAnimating) return
    
    this.isAnimating = true
    this.currentFocusLevel = levelName
    
    const transition = this.transitionCurves.get(levelName)
    if (!transition) return
    
    const startPosition = this.camera.position.clone()
    const startLookAt = new THREE.Vector3(0, 1.5, 0) // Default look at
    
    const targetPosition = transition.position
    const targetLookAt = transition.lookAt
    
    const duration = 1500 // ms
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Smooth easing function (ease-in-out cubic)
      const eased = progress < 0.5 
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2
      
      // Interpolate camera position
      this.camera.position.lerpVectors(startPosition, targetPosition, eased)
      
      // Interpolate look at target
      const currentLookAt = new THREE.Vector3().lerpVectors(startLookAt, targetLookAt, eased)
      this.camera.lookAt(currentLookAt)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        this.isAnimating = false
        console.log(`✅ Camera focused on ${levelName}`)
      }
    }
    
    animate()
  }

  /**
   * Show educational content for level
   */
  showEducationalContent(levelName) {
    const content = this.levelContent[levelName]
    
    // Dispatch event for UI to show content
    const event = new CustomEvent('show-educational-content', {
      detail: {
        level: levelName,
        content: content
      }
    })
    
    document.dispatchEvent(event)
  }

  /**
   * Add memorial photo to altar level
   */
  addMemorialPhoto(memorial, levelName = 'tierra') {
    const level = this.levelElements.get(levelName)
    if (!level) return
    
    console.log(`📸 Adding memorial photo for ${memorial.name} to ${levelName}`)
    
    // Create photo frame
    const frameGeometry = new THREE.PlaneGeometry(0.4, 0.5)
    const frameMaterial = new THREE.MeshLambertMaterial({
      color: 0xFFFFFF,
      transparent: true
    })
    
    // Load memorial photo
    if (memorial.photo) {
      const textureLoader = new THREE.TextureLoader()
      textureLoader.load(
        memorial.photo,
        (texture) => {
          // Apply texture with proper aspect ratio
          texture.minFilter = THREE.LinearFilter
          texture.magFilter = THREE.LinearFilter
          frameMaterial.map = texture
          frameMaterial.needsUpdate = true
          
          // Add subtle glow effect
          frameMaterial.emissive = new THREE.Color(0x222222)
        },
        undefined,
        (error) => {
          console.warn('Failed to load memorial photo:', error)
          // Use placeholder texture
          this.createPlaceholderTexture(frameMaterial, memorial.name)
        }
      )
    } else {
      this.createPlaceholderTexture(frameMaterial, memorial.name)
    }
    
    const frame = new THREE.Mesh(frameGeometry, frameMaterial)
    
    // Position frame on the level
    const levelY = level.position.y
    const existingMemorials = Array.from(this.memorialFrames.values())
      .filter(f => Math.abs(f.position.y - levelY) < 0.1).length
    
    const angle = (existingMemorials / 6) * Math.PI * 2
    const radius = 1.2
    
    frame.position.set(
      Math.cos(angle) * radius,
      levelY + 0.3,
      Math.sin(angle) * radius
    )
    
    // Make frame face the center
    frame.lookAt(0, levelY + 0.3, 0)
    
    // Add interaction data
    frame.userData = {
      type: 'memorial',
      memorial: memorial,
      interactive: true
    }
    
    // Add to scene and tracking
    this.altarGroup.add(frame)
    this.memorialFrames.set(memorial.id, frame)
    
    // Add floating animation
    this.addMemorialAnimation(frame)
    
    // Add name label
    this.addMemorialLabel(memorial, frame.position)
    
    return frame
  }

  /**
   * Create placeholder texture for memorial without photo
   */
  createPlaceholderTexture(material, name) {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = 256
    canvas.height = 320
    
    // Draw background
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, '#4A4A4A')
    gradient.addColorStop(1, '#2A2A2A')
    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw border
    context.strokeStyle = '#FFD700'
    context.lineWidth = 4
    context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16)
    
    // Draw name
    context.fillStyle = '#FFFFFF'
    context.font = 'bold 24px Arial'
    context.textAlign = 'center'
    context.fillText(name, canvas.width / 2, canvas.height / 2)
    
    // Draw memorial symbol
    context.font = '48px Arial'
    context.fillText('🕊️', canvas.width / 2, canvas.height / 2 - 40)
    
    const texture = new THREE.CanvasTexture(canvas)
    material.map = texture
    material.needsUpdate = true
  }

  /**
   * Add floating animation to memorial frame
   */
  addMemorialAnimation(frame) {
    const originalY = frame.position.y
    const startTime = Date.now() + Math.random() * 1000 // Stagger animations
    
    const animate = () => {
      if (frame.parent) {
        const time = (Date.now() - startTime) * 0.001
        frame.position.y = originalY + Math.sin(time * 1.5) * 0.05
        frame.rotation.z = Math.sin(time * 0.8) * 0.02
        requestAnimationFrame(animate)
      }
    }
    
    animate()
  }

  /**
   * Add name label for memorial
   */
  addMemorialLabel(memorial, position) {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = 256
    canvas.height = 64
    
    // Draw background
    context.fillStyle = 'rgba(0, 0, 0, 0.8)'
    context.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw text
    context.fillStyle = '#FFD700'
    context.font = 'bold 20px Arial'
    context.textAlign = 'center'
    context.fillText(memorial.name, canvas.width / 2, 45)
    
    const texture = new THREE.CanvasTexture(canvas)
    const labelMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9
    })
    
    const labelGeometry = new THREE.PlaneGeometry(0.8, 0.2)
    const label = new THREE.Mesh(labelGeometry, labelMaterial)
    
    label.position.copy(position)
    label.position.y -= 0.4
    label.lookAt(0, position.y, 0)
    
    this.altarGroup.add(label)
    
    return label
  }

  /**
   * Remove memorial from altar
   */
  removeMemorial(memorialId) {
    const frame = this.memorialFrames.get(memorialId)
    if (frame) {
      this.altarGroup.remove(frame)
      this.memorialFrames.delete(memorialId)
      
      // Also remove associated label
      const objectsToRemove = []
      this.altarGroup.traverse((child) => {
        if (child.userData.memorialId === memorialId) {
          objectsToRemove.push(child)
        }
      })
      
      objectsToRemove.forEach(obj => this.altarGroup.remove(obj))
    }
  }

  /**
   * Update memorial photo
   */
  updateMemorial(memorial) {
    this.removeMemorial(memorial.id)
    this.addMemorialPhoto(memorial, memorial.altarLevel || 'tierra')
  }

  /**
   * Reset camera to default position
   */
  resetCameraView() {
    if (this.isAnimating) return
    
    this.isAnimating = true
    this.currentFocusLevel = null
    
    // Hide all highlights
    this.highlightMaterials.forEach((highlight, name) => {
      this.hideHighlight(name)
    })
    
    const startPosition = this.camera.position.clone()
    const targetPosition = new THREE.Vector3(0, 2, 5)
    const targetLookAt = new THREE.Vector3(0, 1.5, 0)
    
    const duration = 1000
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      
      this.camera.position.lerpVectors(startPosition, targetPosition, eased)
      this.camera.lookAt(targetLookAt)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        this.isAnimating = false
        appState.set('ui.currentLevel', null)
      }
    }
    
    animate()
  }

  /**
   * Get interactive objects for raycasting
   */
  getInteractiveObjects() {
    const objects = []
    
    // Add level elements
    this.levelElements.forEach(element => {
      objects.push(element)
    })
    
    // Add memorial frames
    this.memorialFrames.forEach(frame => {
      objects.push(frame)
    })
    
    return objects
  }

  /**
   * Cleanup resources
   */
  dispose() {
    // Stop all animations
    if (this.animationMixer) {
      this.animationMixer.stopAllAction()
    }
    
    // Clear maps
    this.levelElements.clear()
    this.memorialFrames.clear()
    this.highlightMaterials.clear()
    this.activeAnimations.clear()
    
    console.log('🧹 Interactive altar elements disposed')
  }
}
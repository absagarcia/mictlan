/**
 * AR Altar Component
 * Renders the Day of the Dead altar in 3D with AR capabilities
 */

import * as THREE from 'three'
import { appState } from '../../state/AppState.js'
import { arManager } from './ARManager.js'
import { webXRPolyfill } from './WebXRPolyfill.js'

export class ARAltarComponent {
  constructor(container, memoryData = []) {
    this.container = container
    this.memoryData = memoryData
    
    // Three.js core objects
    this.scene = null
    this.camera = null
    this.renderer = null
    this.altarGroup = null
    
    // AR session
    this.xrSession = null
    this.xrReferenceSpace = null
    
    // Altar levels
    this.levels = {
      tierra: { y: 0, name: 'Nivel Terrenal', memorials: [] },
      purgatorio: { y: 1.5, name: 'Nivel Purgatorio', memorials: [] },
      cielo: { y: 3, name: 'Nivel Celestial', memorials: [] }
    }
    
    // Interactive elements
    this.interactiveObjects = []
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    
    // Animation
    this.animationMixer = null
    this.clock = new THREE.Clock()
    
    // State
    this.isInitialized = false
    this.isARActive = false
  }

  /**
   * Initialize the AR altar component
   */
  async init() {
    if (this.isInitialized) return

    try {
      console.log('🏛️ Initializing AR Altar Component...')
      
      // Setup Three.js scene
      this.setupScene()
      
      // Setup camera
      this.setupCamera()
      
      // Setup renderer
      this.setupRenderer()
      
      // Setup lighting
      this.setupLighting()
      
      // Load altar models
      await this.loadAltarModels()
      
      // Setup interactions
      this.setupInteractions()
      
      // Setup AR if supported
      await this.setupAR()
      
      // Setup family relationship visualization
      this.setupFamilyRelationshipHandlers()
      
      // Start render loop
      this.startRenderLoop()
      
      this.isInitialized = true
      console.log('✅ AR Altar Component initialized')
      
    } catch (error) {
      console.error('❌ Failed to initialize AR Altar Component:', error)
      throw error
    }
  }

  /**
   * Setup Three.js scene
   */
  setupScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x1a1a1a)
    
    // Create altar group for easy manipulation
    this.altarGroup = new THREE.Group()
    this.altarGroup.name = 'altar'
    this.scene.add(this.altarGroup)
  }

  /**
   * Setup camera
   */
  setupCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
    this.camera.position.set(0, 2, 5)
    this.camera.lookAt(0, 1.5, 0)
  }

  /**
   * Setup WebGL renderer with performance optimization
   */
  setupRenderer() {
    // Get recommended settings from AR manager
    const settings = arManager.getRecommendedSettings()
    
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: settings.antialias,
      alpha: true,
      powerPreference: 'high-performance'
    })
    
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(settings.pixelRatio)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.shadowMap.mapSize.width = settings.shadowMapSize
    this.renderer.shadowMap.mapSize.height = settings.shadowMapSize
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    
    // Enable XR
    this.renderer.xr.enabled = true
    
    this.container.appendChild(this.renderer.domElement)
    
    // Handle resize
    window.addEventListener('resize', this.onWindowResize.bind(this))
  }

  /**
   * Setup lighting for the altar
   */
  setupLighting() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
    this.scene.add(ambientLight)
    
    // Main directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    directionalLight.shadow.camera.near = 0.5
    directionalLight.shadow.camera.far = 50
    directionalLight.shadow.camera.left = -10
    directionalLight.shadow.camera.right = 10
    directionalLight.shadow.camera.top = 10
    directionalLight.shadow.camera.bottom = -10
    this.scene.add(directionalLight)
    
    // Warm candle-like point lights for atmosphere
    const candleLight1 = new THREE.PointLight(0xffaa44, 0.6, 10)
    candleLight1.position.set(-2, 1, 2)
    this.scene.add(candleLight1)
    
    const candleLight2 = new THREE.PointLight(0xffaa44, 0.6, 10)
    candleLight2.position.set(2, 1, 2)
    this.scene.add(candleLight2)
    
    // Spotlight for highlighting active level
    this.spotlight = new THREE.SpotLight(0xffffff, 1, 10, Math.PI / 6, 0.5)
    this.spotlight.position.set(0, 8, 0)
    this.spotlight.target.position.set(0, 1.5, 0)
    this.spotlight.castShadow = true
    this.scene.add(this.spotlight)
    this.scene.add(this.spotlight.target)
  }

  /**
   * Load 3D altar models
   */
  async loadAltarModels() {
    console.log('📦 Loading altar models...')
    
    // For now, create procedural altar geometry
    // In production, you would load GLTF models
    await this.createProceduralAltar()
    
    // Add memorials to appropriate levels
    this.distributeMemorials()
  }

  /**
   * Create procedural altar geometry
   */
  async createProceduralAltar() {
    const altarMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x8B4513,
      transparent: true,
      opacity: 0.9
    })
    
    // Create three levels
    Object.entries(this.levels).forEach(([levelName, levelData], index) => {
      // Base platform
      const platformGeometry = new THREE.BoxGeometry(4, 0.2, 3)
      const platform = new THREE.Mesh(platformGeometry, altarMaterial)
      platform.position.y = levelData.y
      platform.castShadow = true
      platform.receiveShadow = true
      platform.userData = { 
        type: 'altar-level', 
        level: levelName,
        interactive: true
      }
      
      this.altarGroup.add(platform)
      this.interactiveObjects.push(platform)
      
      // Decorative elements
      this.addLevelDecorations(levelName, levelData.y)
    })
    
    // Add traditional altar cloth
    const clothGeometry = new THREE.PlaneGeometry(4.2, 3.2)
    const clothMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x8B0000,
      transparent: true,
      opacity: 0.7
    })
    const cloth = new THREE.Mesh(clothGeometry, clothMaterial)
    cloth.rotation.x = -Math.PI / 2
    cloth.position.y = 0.11
    this.altarGroup.add(cloth)
  }

  /**
   * Add decorative elements to each level
   */
  addLevelDecorations(levelName, y) {
    // Candles
    const candleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3)
    const candleMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFACD })
    
    for (let i = 0; i < 4; i++) {
      const candle = new THREE.Mesh(candleGeometry, candleMaterial)
      const angle = (i / 4) * Math.PI * 2
      candle.position.set(
        Math.cos(angle) * 1.5,
        y + 0.35,
        Math.sin(angle) * 1
      )
      candle.castShadow = true
      this.altarGroup.add(candle)
      
      // Flame effect
      const flameGeometry = new THREE.SphereGeometry(0.03, 8, 8)
      const flameMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFAA00,
        transparent: true,
        opacity: 0.8
      })
      const flame = new THREE.Mesh(flameGeometry, flameMaterial)
      flame.position.copy(candle.position)
      flame.position.y += 0.2
      this.altarGroup.add(flame)
    }
    
    // Marigold flowers (cempasúchil)
    if (levelName === 'tierra') {
      this.addMarigolds(y)
    }
  }

  /**
   * Add marigold flowers to the altar
   */
  addMarigolds(y) {
    const petalGeometry = new THREE.SphereGeometry(0.1, 8, 8)
    const petalMaterial = new THREE.MeshLambertMaterial({ color: 0xFFA500 })
    
    for (let i = 0; i < 8; i++) {
      const flower = new THREE.Group()
      
      // Create petals
      for (let j = 0; j < 8; j++) {
        const petal = new THREE.Mesh(petalGeometry, petalMaterial)
        const angle = (j / 8) * Math.PI * 2
        petal.position.set(
          Math.cos(angle) * 0.1,
          0,
          Math.sin(angle) * 0.1
        )
        petal.scale.set(0.5, 0.3, 0.5)
        flower.add(petal)
      }
      
      // Position flower
      const angle = (i / 8) * Math.PI * 2
      flower.position.set(
        Math.cos(angle) * 1.8,
        y + 0.25,
        Math.sin(angle) * 1.3
      )
      
      this.altarGroup.add(flower)
    }
  }

  /**
   * Distribute memorials across altar levels
   */
  distributeMemorials() {
    if (!this.memoryData || this.memoryData.length === 0) return
    
    this.memoryData.forEach((memorial, index) => {
      // Determine level based on memorial data or distribute evenly
      const levelNames = Object.keys(this.levels)
      const levelName = memorial.altarLevel ? 
        levelNames[memorial.altarLevel - 1] : 
        levelNames[index % levelNames.length]
      
      this.addMemorialToAltar(memorial, levelName)
    })
  }

  /**
   * Add a memorial to the altar
   */
  addMemorialToAltar(memorial, levelName = null) {
    // Determine level based on memorial data or use specified level
    if (!levelName) {
      const levelNames = Object.keys(this.levels)
      levelName = memorial.altarLevel ? 
        levelNames[memorial.altarLevel - 1] : 
        this.determineOptimalLevel(memorial)
    }
    
    const level = this.levels[levelName]
    if (!level) return
    
    // Create memorial photo frame with enhanced styling
    const frameGeometry = new THREE.PlaneGeometry(0.4, 0.5)
    const frameMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.9
    })
    
    // Load memorial photo if available
    if (memorial.photo) {
      const textureLoader = new THREE.TextureLoader()
      textureLoader.load(
        memorial.photo,
        (texture) => {
          texture.minFilter = THREE.LinearFilter
          texture.magFilter = THREE.LinearFilter
          frameMaterial.map = texture
          frameMaterial.needsUpdate = true
        },
        undefined,
        (error) => {
          console.warn('Failed to load memorial photo:', error)
          // Use default memorial texture
          this.createDefaultMemorialTexture(frameMaterial, memorial)
        }
      )
    } else {
      // Create default memorial texture with name
      this.createDefaultMemorialTexture(frameMaterial, memorial)
    }
    
    const frame = new THREE.Mesh(frameGeometry, frameMaterial)
    
    // Position on the level with better spacing
    const existingMemorials = level.memorials.length
    const maxMemorials = 8
    const angle = (existingMemorials / maxMemorials) * Math.PI * 2
    const radius = 1.2
    
    frame.position.set(
      Math.cos(angle) * radius,
      level.y + 0.6,
      Math.sin(angle) * radius
    )
    frame.lookAt(0, level.y + 0.6, 0)
    
    // Add subtle glow effect
    const glowGeometry = new THREE.PlaneGeometry(0.5, 0.6)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    })
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    glow.position.copy(frame.position)
    glow.position.z -= 0.01
    glow.lookAt(0, level.y + 0.6, 0)
    
    frame.userData = {
      type: 'memorial',
      memorial: memorial,
      interactive: true,
      level: levelName,
      glowEffect: glow
    }
    
    this.altarGroup.add(frame)
    this.altarGroup.add(glow)
    this.interactiveObjects.push(frame)
    level.memorials.push(memorial)
    
    // Add enhanced name label
    this.addMemorialLabel(memorial, frame.position, levelName)
    
    // Add memorial to app state if not already there
    const existingMemorials = appState.get('memorials') || []
    const memorialExists = existingMemorials.find(m => m.id === memorial.id)
    if (!memorialExists) {
      appState.actions.addMemorial(memorial)
    }
    
    console.log(`🕯️ Added memorial ${memorial.name} to ${levelName} level`)
    
    return frame
  }

  /**
   * Determine optimal altar level for memorial based on relationship and age
   */
  determineOptimalLevel(memorial) {
    const relationship = memorial.relationship?.toLowerCase() || ''
    
    // Calculate age if dates are available
    let age = 0
    if (memorial.birthDate && memorial.deathDate) {
      const birth = new Date(memorial.birthDate)
      const death = new Date(memorial.deathDate)
      age = death.getFullYear() - birth.getFullYear()
    }
    
    // Grandparents and great-grandparents go to heaven level (cielo)
    if (relationship.includes('abuelo') || relationship.includes('abuela') || 
        relationship.includes('bisabuelo') || relationship.includes('bisabuela') ||
        age > 75) {
      return 'cielo'
    }
    
    // Parents and older relatives go to purgatory level
    if (relationship.includes('padre') || relationship.includes('madre') ||
        relationship.includes('tio') || relationship.includes('tia') ||
        (age > 45 && age <= 75)) {
      return 'purgatorio'
    }
    
    // Siblings, children, and younger relatives go to earth level (tierra)
    return 'tierra'
  }

  /**
   * Create default memorial texture with name
   */
  createDefaultMemorialTexture(material, memorial) {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = 256
    canvas.height = 320
    
    // Background gradient
    const gradient = context.createLinearGradient(0, 0, 0, 320)
    gradient.addColorStop(0, '#f8f9fa')
    gradient.addColorStop(1, '#e9ecef')
    context.fillStyle = gradient
    context.fillRect(0, 0, 256, 320)
    
    // Border
    context.strokeStyle = '#6c757d'
    context.lineWidth = 4
    context.strokeRect(2, 2, 252, 316)
    
    // Memorial icon
    context.fillStyle = '#495057'
    context.font = 'bold 48px Arial'
    context.textAlign = 'center'
    context.fillText('🕊️', 128, 100)
    
    // Name
    context.fillStyle = '#212529'
    context.font = 'bold 20px Arial'
    context.textAlign = 'center'
    
    // Wrap text if too long
    const name = memorial.name || 'Memorial'
    const words = name.split(' ')
    let line = ''
    let y = 160
    
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' '
      const metrics = context.measureText(testLine)
      const testWidth = metrics.width
      
      if (testWidth > 200 && n > 0) {
        context.fillText(line, 128, y)
        line = words[n] + ' '
        y += 25
      } else {
        line = testLine
      }
    }
    context.fillText(line, 128, y)
    
    // Relationship
    if (memorial.relationship) {
      context.font = '16px Arial'
      context.fillStyle = '#6c757d'
      context.fillText(memorial.relationship, 128, y + 30)
    }
    
    // Dates
    if (memorial.birthDate || memorial.deathDate) {
      const birthYear = memorial.birthDate ? new Date(memorial.birthDate).getFullYear() : '?'
      const deathYear = memorial.deathDate ? new Date(memorial.deathDate).getFullYear() : '?'
      context.font = '14px Arial'
      context.fillText(`${birthYear} - ${deathYear}`, 128, y + 50)
    }
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    material.map = texture
    material.needsUpdate = true
  }

  /**
   * Add text label for memorial
   */
  addMemorialLabel(memorial, position) {
    // Create canvas for text
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    canvas.width = 256
    canvas.height = 64
    
    context.fillStyle = 'rgba(0, 0, 0, 0.8)'
    context.fillRect(0, 0, canvas.width, canvas.height)
    
    context.fillStyle = 'white'
    context.font = '20px Arial'
    context.textAlign = 'center'
    context.fillText(memorial.name, canvas.width / 2, canvas.height / 2 + 7)
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas)
    const labelMaterial = new THREE.MeshBasicMaterial({ 
      map: texture,
      transparent: true
    })
    
    const labelGeometry = new THREE.PlaneGeometry(0.5, 0.125)
    const label = new THREE.Mesh(labelGeometry, labelMaterial)
    
    label.position.copy(position)
    label.position.y -= 0.3
    label.lookAt(0, position.y, 0)
    
    this.altarGroup.add(label)
  }

  /**
   * Setup interaction handling
   */
  setupInteractions() {
    // Mouse/touch events
    this.container.addEventListener('click', this.onInteraction.bind(this))
    this.container.addEventListener('touchend', this.onInteraction.bind(this))
    this.container.addEventListener('mousemove', this.onMouseMove.bind(this))
  }

  /**
   * Handle interaction events
   */
  onInteraction(event) {
    event.preventDefault()
    
    // Calculate mouse position
    const rect = this.container.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    // Raycast for intersections
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects)
    
    if (intersects.length > 0) {
      const intersected = intersects[0].object
      this.handleObjectInteraction(intersected)
    }
  }

  /**
   * Handle mouse move for hover effects
   */
  onMouseMove(event) {
    const rect = this.container.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    // Update hover effects
    this.updateHoverEffects()
  }

  /**
   * Update hover effects
   */
  updateHoverEffects() {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.interactiveObjects)
    
    // Reset all objects
    this.interactiveObjects.forEach(obj => {
      if (obj.material.emissive) {
        obj.material.emissive.setHex(0x000000)
      }
    })
    
    // Highlight hovered object
    if (intersects.length > 0) {
      const intersected = intersects[0].object
      if (intersected.material.emissive) {
        intersected.material.emissive.setHex(0x444444)
      }
      this.container.style.cursor = 'pointer'
    } else {
      this.container.style.cursor = 'default'
    }
  }

  /**
   * Handle object interaction
   */
  handleObjectInteraction(object) {
    const userData = object.userData
    
    if (userData.type === 'altar-level') {
      this.showLevelInfo(userData.level)
    } else if (userData.type === 'memorial') {
      this.showMemorialInfo(userData.memorial)
    }
  }

  /**
   * Show information about an altar level
   */
  showLevelInfo(level) {
    console.log(`📚 Showing info for level: ${level}`)
    
    // Animate camera to focus on level
    this.focusOnLevel(level)
    
    // Dispatch event for UI to show educational content
    const event = new CustomEvent('altar-level-selected', {
      detail: { level, levelData: this.levels[level] }
    })
    this.container.dispatchEvent(event)
  }

  /**
   * Show information about a memorial
   */
  showMemorialInfo(memorial) {
    console.log(`👤 Showing info for memorial: ${memorial.name}`)
    
    // Dispatch event for UI to show memorial details
    const event = new CustomEvent('memorial-selected', {
      detail: { memorial }
    })
    this.container.dispatchEvent(event)
  }

  /**
   * Focus camera on specific altar level
   */
  focusOnLevel(levelName) {
    const level = this.levels[levelName]
    if (!level) return
    
    // Animate camera position
    const targetPosition = new THREE.Vector3(0, level.y + 1, 3)
    const targetLookAt = new THREE.Vector3(0, level.y, 0)
    
    // Simple animation (in production, use a proper tween library)
    const startPosition = this.camera.position.clone()
    const startTime = Date.now()
    const duration = 1000
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Smooth easing
      const eased = 1 - Math.pow(1 - progress, 3)
      
      this.camera.position.lerpVectors(startPosition, targetPosition, eased)
      this.camera.lookAt(targetLookAt)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    animate()
  }

  /**
   * Setup AR capabilities
   */
  async setupAR() {
    if (!('xr' in navigator)) {
      console.log('⚠️ WebXR not supported')
      return
    }
    
    try {
      const supported = await navigator.xr.isSessionSupported('immersive-ar')
      if (supported) {
        console.log('✅ AR supported')
        appState.set('arSession.isSupported', true)
        this.setupARButton()
      } else {
        console.log('⚠️ AR not supported')
        appState.set('arSession.isSupported', false)
      }
    } catch (error) {
      console.warn('AR support check failed:', error)
      appState.set('arSession.isSupported', false)
    }
  }

  /**
   * Setup AR button
   */
  setupARButton() {
    const arButton = document.createElement('button')
    arButton.id = 'ar-button'
    arButton.textContent = 'Entrar AR'
    arButton.className = 'ar-button'
    arButton.addEventListener('click', this.toggleAR.bind(this))
    
    this.container.appendChild(arButton)
  }

  /**
   * Toggle AR mode
   */
  async toggleAR() {
    if (this.isARActive) {
      await this.exitAR()
    } else {
      await this.enterAR()
    }
  }

  /**
   * Enter AR mode
   */
  async enterAR() {
    try {
      console.log('🥽 Entering AR mode...')
      
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: this.container }
      })
      
      this.xrSession = session
      this.renderer.xr.setSession(session)
      
      // Setup reference space
      this.xrReferenceSpace = await session.requestReferenceSpace('local')
      
      // Handle session end
      session.addEventListener('end', () => {
        this.exitAR()
      })
      
      this.isARActive = true
      appState.actions.startARSession()
      
      // Update button
      const arButton = document.getElementById('ar-button')
      if (arButton) {
        arButton.textContent = 'Salir AR'
      }
      
      console.log('✅ AR mode active')
      
    } catch (error) {
      console.error('❌ Failed to enter AR:', error)
      appState.actions.showNotification({
        type: 'error',
        title: 'Error AR',
        message: 'No se pudo iniciar la realidad aumentada'
      })
    }
  }

  /**
   * Exit AR mode
   */
  async exitAR() {
    if (this.xrSession) {
      await this.xrSession.end()
    }
    
    this.xrSession = null
    this.xrReferenceSpace = null
    this.isARActive = false
    
    appState.actions.endARSession()
    
    // Update button
    const arButton = document.getElementById('ar-button')
    if (arButton) {
      arButton.textContent = 'Entrar AR'
    }
    
    console.log('👋 Exited AR mode')
  }

  /**
   * Start render loop
   */
  startRenderLoop() {
    const animate = () => {
      // Update animations
      if (this.animationMixer) {
        const delta = this.clock.getDelta()
        this.animationMixer.update(delta)
      }
      
      // Render scene
      this.renderer.render(this.scene, this.camera)
    }
    
    this.renderer.setAnimationLoop(animate)
  }

  /**
   * Handle window resize
   */
  onWindowResize() {
    const width = this.container.clientWidth
    const height = this.container.clientHeight
    
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    
    this.renderer.setSize(width, height)
  }

  /**
   * Add memorial to altar (public method)
   */
  addMemorial(memorial) {
    this.memoryData.push(memorial)
    this.addMemorialToAltar(memorial)
  }

  /**
   * Remove memorial from altar
   */
  removeMemorial(memorialId) {
    // Remove from data
    this.memoryData = this.memoryData.filter(m => m.id !== memorialId)
    
    // Remove from scene
    const objectsToRemove = []
    this.altarGroup.traverse((child) => {
      if (child.userData.memorial && child.userData.memorial.id === memorialId) {
        objectsToRemove.push(child)
      }
    })
    
    objectsToRemove.forEach(obj => {
      this.altarGroup.remove(obj)
      const index = this.interactiveObjects.indexOf(obj)
      if (index > -1) {
        this.interactiveObjects.splice(index, 1)
      }
    })
  }

  /**
   * Update memorial data
   */
  updateMemorial(memorial) {
    const index = this.memoryData.findIndex(m => m.id === memorial.id)
    if (index > -1) {
      this.memoryData[index] = memorial
      // Remove and re-add to update visuals
      this.removeMemorial(memorial.id)
      this.addMemorialToAltar(memorial)
    }
  }

  /**
   * Setup family relationship visualization handlers
   */
  setupFamilyRelationshipHandlers() {
    // Listen for family tree events
    document.addEventListener('show-family-connections-ar', (event) => {
      this.showFamilyConnectionsInAR(event.detail)
    })

    document.addEventListener('highlight-generation-ar', (event) => {
      this.highlightGenerationInAR(event.detail)
    })

    document.addEventListener('show-family-path-ar', (event) => {
      this.showFamilyPathInAR(event.detail)
    })

    document.addEventListener('view-memorial-in-ar', (event) => {
      this.focusOnMemorialInAR(event.detail.memorial)
    })

    console.log('👨‍👩‍👧‍👦 Family relationship handlers setup')
  }

  /**
   * Show family connections in AR with visual links
   */
  showFamilyConnectionsInAR(detail) {
    const { centerMemorial, connectedMemorials, relationships } = detail
    
    console.log(`🔗 Showing family connections for ${centerMemorial.name} in AR`)
    
    // Clear existing connection visualizations
    this.clearFamilyVisualizations()
    
    // Create connection lines group
    const connectionsGroup = new THREE.Group()
    connectionsGroup.name = 'family-connections'
    
    // Find center memorial in scene
    const centerMemorialObject = this.findMemorialInScene(centerMemorial.id)
    if (!centerMemorialObject) return
    
    // Create connections to family members
    connectedMemorials.forEach(memorial => {
      const memorialObject = this.findMemorialInScene(memorial.id)
      if (memorialObject) {
        const connectionType = this.getConnectionType(centerMemorial.id, memorial.id, relationships)
        const connectionLine = this.createFamilyConnectionLine(
          centerMemorialObject.position,
          memorialObject.position,
          connectionType
        )
        connectionsGroup.add(connectionLine)
        
        // Add pulsing effect to connected memorials
        this.addPulsingEffect(memorialObject)
      }
    })
    
    // Add connections to scene
    this.altarGroup.add(connectionsGroup)
    
    // Focus camera on the family group
    this.focusOnFamilyGroup([centerMemorial, ...connectedMemorials])
  }

  /**
   * Highlight generation in AR
   */
  highlightGenerationInAR(detail) {
    const { generation, memorials } = detail
    
    console.log(`👥 Highlighting generation ${generation + 1} in AR`)
    
    // Clear existing visualizations
    this.clearFamilyVisualizations()
    
    // Create generation highlight group
    const generationGroup = new THREE.Group()
    generationGroup.name = 'generation-highlight'
    
    // Add generation ring around each memorial
    memorials.forEach(memorial => {
      const memorialObject = this.findMemorialInScene(memorial.id)
      if (memorialObject) {
        const generationRing = this.createGenerationRing(memorialObject.position, generation)
        generationGroup.add(generationRing)
        
        // Add floating effect
        this.addFloatingEffect(memorialObject)
      }
    })
    
    this.altarGroup.add(generationGroup)
    
    // Focus camera on generation
    this.focusOnFamilyGroup(memorials)
  }

  /**
   * Show family path in AR (genealogical line)
   */
  showFamilyPathInAR(detail) {
    const { targetMemorial, genealogicalPath } = detail
    
    console.log(`🛤️ Showing family path for ${targetMemorial.name} in AR`)
    
    // Clear existing visualizations
    this.clearFamilyVisualizations()
    
    if (genealogicalPath.length < 2) return
    
    // Create path visualization group
    const pathGroup = new THREE.Group()
    pathGroup.name = 'family-path'
    
    // Create path line through generations
    const pathPoints = []
    genealogicalPath.forEach(memorial => {
      const memorialObject = this.findMemorialInScene(memorial.id)
      if (memorialObject) {
        pathPoints.push(memorialObject.position.clone())
        
        // Add path marker
        const pathMarker = this.createPathMarker(memorialObject.position)
        pathGroup.add(pathMarker)
      }
    })
    
    // Create smooth path curve
    if (pathPoints.length > 1) {
      const pathCurve = this.createPathCurve(pathPoints)
      pathGroup.add(pathCurve)
    }
    
    this.altarGroup.add(pathGroup)
    
    // Animate camera along the path
    this.animateCameraAlongPath(pathPoints)
  }

  /**
   * Focus on memorial in AR
   */
  focusOnMemorialInAR(memorial) {
    const memorialObject = this.findMemorialInScene(memorial.id)
    if (!memorialObject) return
    
    console.log(`🎯 Focusing on ${memorial.name} in AR`)
    
    // Clear existing visualizations
    this.clearFamilyVisualizations()
    
    // Add spotlight effect
    const spotlight = this.createMemorialSpotlight(memorialObject.position)
    this.altarGroup.add(spotlight)
    
    // Focus camera on memorial
    this.focusOnPosition(memorialObject.position)
  }

  /**
   * Find memorial object in the scene
   */
  findMemorialInScene(memorialId) {
    let foundObject = null
    this.altarGroup.traverse((child) => {
      if (child.userData.memorial && child.userData.memorial.id === memorialId) {
        foundObject = child
      }
    })
    return foundObject
  }

  /**
   * Get connection type between two memorials
   */
  getConnectionType(memorial1Id, memorial2Id, relationships) {
    if (relationships.parents.includes(memorial2Id)) return 'parent'
    if (relationships.children.includes(memorial2Id)) return 'child'
    if (relationships.spouse === memorial2Id) return 'spouse'
    return 'family'
  }

  /**
   * Create family connection line
   */
  createFamilyConnectionLine(pos1, pos2, connectionType) {
    const geometry = new THREE.BufferGeometry().setFromPoints([pos1, pos2])
    
    let material
    switch (connectionType) {
      case 'parent':
        material = new THREE.LineBasicMaterial({ 
          color: 0x4CAF50, 
          linewidth: 3,
          transparent: true,
          opacity: 0.8
        })
        break
      case 'child':
        material = new THREE.LineBasicMaterial({ 
          color: 0x2196F3, 
          linewidth: 3,
          transparent: true,
          opacity: 0.8
        })
        break
      case 'spouse':
        material = new THREE.LineBasicMaterial({ 
          color: 0xE91E63, 
          linewidth: 4,
          transparent: true,
          opacity: 0.9
        })
        break
      default:
        material = new THREE.LineBasicMaterial({ 
          color: 0xFFD700, 
          linewidth: 2,
          transparent: true,
          opacity: 0.7
        })
    }
    
    const line = new THREE.Line(geometry, material)
    line.userData = { type: 'family-connection', connectionType }
    
    return line
  }

  /**
   * Create generation ring
   */
  createGenerationRing(position, generation) {
    const ringGeometry = new THREE.RingGeometry(0.3, 0.4, 32)
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    })
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.position.copy(position)
    ring.position.y -= 0.1
    ring.rotation.x = -Math.PI / 2
    
    // Add pulsing animation
    const startTime = Date.now()
    const animate = () => {
      if (ring.parent) {
        const time = (Date.now() - startTime) * 0.002
        ring.material.opacity = 0.4 + Math.sin(time) * 0.2
        ring.scale.setScalar(1 + Math.sin(time * 2) * 0.1)
        requestAnimationFrame(animate)
      }
    }
    animate()
    
    return ring
  }

  /**
   * Create path marker
   */
  createPathMarker(position) {
    const markerGeometry = new THREE.SphereGeometry(0.05, 16, 16)
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.8
    })
    
    const marker = new THREE.Mesh(markerGeometry, markerMaterial)
    marker.position.copy(position)
    marker.position.y += 0.6
    
    return marker
  }

  /**
   * Create path curve
   */
  createPathCurve(points) {
    const curve = new THREE.CatmullRomCurve3(points)
    const curveGeometry = new THREE.TubeGeometry(curve, 64, 0.02, 8, false)
    const curveMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      transparent: true,
      opacity: 0.7
    })
    
    const pathCurve = new THREE.Mesh(curveGeometry, curveMaterial)
    pathCurve.userData = { type: 'family-path-curve' }
    
    return pathCurve
  }

  /**
   * Create memorial spotlight
   */
  createMemorialSpotlight(position) {
    const spotlight = new THREE.SpotLight(0xFFD700, 2, 10, Math.PI / 6, 0.5)
    spotlight.position.copy(position)
    spotlight.position.y += 2
    spotlight.target.position.copy(position)
    
    const spotlightGroup = new THREE.Group()
    spotlightGroup.add(spotlight)
    spotlightGroup.add(spotlight.target)
    spotlightGroup.name = 'memorial-spotlight'
    
    return spotlightGroup
  }

  /**
   * Add pulsing effect to memorial
   */
  addPulsingEffect(memorialObject) {
    const originalScale = memorialObject.scale.clone()
    const startTime = Date.now()
    
    const animate = () => {
      if (memorialObject.parent) {
        const time = (Date.now() - startTime) * 0.003
        const scale = 1 + Math.sin(time) * 0.1
        memorialObject.scale.copy(originalScale).multiplyScalar(scale)
        requestAnimationFrame(animate)
      }
    }
    animate()
  }

  /**
   * Add floating effect to memorial
   */
  addFloatingEffect(memorialObject) {
    const originalY = memorialObject.position.y
    const startTime = Date.now()
    
    const animate = () => {
      if (memorialObject.parent) {
        const time = (Date.now() - startTime) * 0.002
        memorialObject.position.y = originalY + Math.sin(time) * 0.1
        requestAnimationFrame(animate)
      }
    }
    animate()
  }

  /**
   * Focus camera on family group
   */
  focusOnFamilyGroup(memorials) {
    if (memorials.length === 0) return
    
    // Calculate bounding box of family group
    const positions = []
    memorials.forEach(memorial => {
      const memorialObject = this.findMemorialInScene(memorial.id)
      if (memorialObject) {
        positions.push(memorialObject.position)
      }
    })
    
    if (positions.length === 0) return
    
    // Calculate center and size
    const center = new THREE.Vector3()
    positions.forEach(pos => center.add(pos))
    center.divideScalar(positions.length)
    
    // Calculate distance needed to fit all memorials
    let maxDistance = 0
    positions.forEach(pos => {
      const distance = center.distanceTo(pos)
      maxDistance = Math.max(maxDistance, distance)
    })
    
    // Position camera
    const cameraDistance = Math.max(maxDistance * 2, 3)
    const targetPosition = new THREE.Vector3(
      center.x,
      center.y + cameraDistance * 0.5,
      center.z + cameraDistance
    )
    
    this.animateCameraToPosition(targetPosition, center)
  }

  /**
   * Focus camera on specific position
   */
  focusOnPosition(position) {
    const targetPosition = new THREE.Vector3(
      position.x,
      position.y + 1,
      position.z + 2
    )
    
    this.animateCameraToPosition(targetPosition, position)
  }

  /**
   * Animate camera to position
   */
  animateCameraToPosition(targetPosition, lookAtPosition) {
    const startPosition = this.camera.position.clone()
    const startTime = Date.now()
    const duration = 1500
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      
      this.camera.position.lerpVectors(startPosition, targetPosition, eased)
      this.camera.lookAt(lookAtPosition)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    animate()
  }

  /**
   * Animate camera along path
   */
  animateCameraAlongPath(pathPoints) {
    if (pathPoints.length < 2) return
    
    const curve = new THREE.CatmullRomCurve3(pathPoints)
    const duration = 3000
    const startTime = Date.now()
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      const point = curve.getPoint(progress)
      const lookAt = curve.getPoint(Math.min(progress + 0.1, 1))
      
      this.camera.position.copy(point)
      this.camera.position.y += 1
      this.camera.lookAt(lookAt)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    animate()
  }

  /**
   * Clear family visualizations
   */
  clearFamilyVisualizations() {
    const visualizationsToRemove = []
    
    this.altarGroup.traverse((child) => {
      if (child.name === 'family-connections' || 
          child.name === 'generation-highlight' || 
          child.name === 'family-path' ||
          child.name === 'memorial-spotlight') {
        visualizationsToRemove.push(child)
      }
    })
    
    visualizationsToRemove.forEach(viz => {
      this.altarGroup.remove(viz)
      
      // Dispose geometry and materials
      viz.traverse((child) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
    })
  }

  /**
   * Cleanup resources
   */
  dispose() {
    // Stop render loop
    this.renderer.setAnimationLoop(null)
    
    // Exit AR if active
    if (this.isARActive) {
      this.exitAR()
    }
    
    // Clear family visualizations
    this.clearFamilyVisualizations()
    
    // Remove family relationship event listeners
    document.removeEventListener('show-family-connections-ar', this.showFamilyConnectionsInAR)
    document.removeEventListener('highlight-generation-ar', this.highlightGenerationInAR)
    document.removeEventListener('show-family-path-ar', this.showFamilyPathInAR)
    document.removeEventListener('view-memorial-in-ar', this.focusOnMemorialInAR)
    
    // Dispose Three.js resources
    this.scene.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose())
        } else {
          child.material.dispose()
        }
      }
    })
    
    this.renderer.dispose()
    
    // Remove event listeners
    window.removeEventListener('resize', this.onWindowResize.bind(this))
    
    // Remove DOM elements
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }
    
    const arButton = document.getElementById('ar-button')
    if (arButton && arButton.parentNode) {
      arButton.parentNode.removeChild(arButton)
    }
  }
}
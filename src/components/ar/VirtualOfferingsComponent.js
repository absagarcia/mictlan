/**
 * Virtual Offerings Component
 * Handles placing traditional Day of the Dead offerings in AR
 */

import * as THREE from 'three'
import { appState } from '../../state/AppState.js'
import MCPService from '../../services/MCPService.js'

export class VirtualOfferingsComponent {
  constructor(scene, altarGroup, camera) {
    this.scene = scene
    this.altarGroup = altarGroup
    this.camera = camera
    
    // Offerings catalog
    this.offeringCatalog = new Map()
    this.placedOfferings = new Map()
    this.offeringModels = new Map()
    
    // Placement system
    this.placementMode = false
    this.selectedOfferingType = null
    this.placementPreview = null
    
    // Raycasting for placement
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.placementSurfaces = []
    
    // Animation system
    this.animationMixer = null
    this.clock = new THREE.Clock()
    
    this.init()
  }

  /**
   * Initialize virtual offerings system
   */
  async init() {
    console.log('🎁 Initializing Virtual Offerings Component...')
    
    // Initialize MCP services
    await MCPService.initialize()
    
    // Setup offering catalog
    this.setupOfferingCatalog()
    
    // Validate offering catalog culturally
    await this.validateOfferingCatalog()
    
    // Create offering models
    await this.createOfferingModels()
    
    // Setup placement surfaces
    this.setupPlacementSurfaces()
    
    // Setup animation system
    this.setupAnimationSystem()
    
    // Setup event listeners
    this.setupEventListeners()
    
    console.log('✅ Virtual Offerings Component initialized')
  }

  /**
   * Setup offering catalog with traditional items
   */
  setupOfferingCatalog() {
    this.offeringCatalog.set('cempasuchil', {
      name: 'Cempasúchil',
      description: 'Flor de muerto que guía las almas con su aroma',
      category: 'flores',
      color: 0xFFA500,
      size: { width: 0.15, height: 0.1, depth: 0.15 },
      meaning: 'Su color dorado y aroma intenso ayuda a las almas a encontrar el camino de regreso',
      placement: ['tierra', 'purgatorio'],
      animation: 'sway'
    })
    
    this.offeringCatalog.set('pan_de_muerto', {
      name: 'Pan de Muerto',
      description: 'Pan tradicional decorado con huesos de masa',
      category: 'comida',
      color: 0xD2691E,
      size: { width: 0.2, height: 0.08, depth: 0.2 },
      meaning: 'Representa el cuerpo y el ciclo de la vida y la muerte',
      placement: ['tierra'],
      animation: 'none'
    })
    
    this.offeringCatalog.set('agua', {
      name: 'Agua',
      description: 'Para calmar la sed del largo viaje',
      category: 'elementos',
      color: 0x87CEEB,
      size: { width: 0.08, height: 0.15, depth: 0.08 },
      meaning: 'Elemento vital que refresca a las almas en su travesía',
      placement: ['tierra', 'purgatorio'],
      animation: 'shimmer'
    })
    
    this.offeringCatalog.set('sal', {
      name: 'Sal',
      description: 'Para purificar y preservar el alma',
      category: 'elementos',
      color: 0xFFFFFF,
      size: { width: 0.12, height: 0.05, depth: 0.12 },
      meaning: 'Purifica y protege el alma de la corrupción durante su viaje',
      placement: ['tierra'],
      animation: 'sparkle'
    })
    
    this.offeringCatalog.set('vela', {
      name: 'Vela',
      description: 'Luz que ilumina el camino de regreso',
      category: 'luz',
      color: 0xFFFACD,
      size: { width: 0.05, height: 0.2, depth: 0.05 },
      meaning: 'La luz guía a las almas y representa la fe y la esperanza',
      placement: ['tierra', 'purgatorio', 'cielo'],
      animation: 'flicker'
    })
    
    this.offeringCatalog.set('incienso', {
      name: 'Incienso',
      description: 'Aroma sagrado que eleva las oraciones',
      category: 'aroma',
      color: 0x8B4513,
      size: { width: 0.03, height: 0.15, depth: 0.03 },
      meaning: 'El humo lleva nuestras oraciones y pensamientos a los difuntos',
      placement: ['purgatorio', 'cielo'],
      animation: 'smoke'
    })
    
    this.offeringCatalog.set('foto', {
      name: 'Fotografía',
      description: 'Imagen del ser querido recordado',
      category: 'personal',
      color: 0xFFFFFF,
      size: { width: 0.15, height: 0.2, depth: 0.01 },
      meaning: 'Mantiene viva la memoria y la presencia del difunto',
      placement: ['cielo'],
      animation: 'glow'
    })
    
    this.offeringCatalog.set('comida_favorita', {
      name: 'Comida Favorita',
      description: 'El platillo que más disfrutaba en vida',
      category: 'comida',
      color: 0xFF6347,
      size: { width: 0.18, height: 0.06, depth: 0.18 },
      meaning: 'Ofrenda personal que conecta con los gustos del difunto',
      placement: ['tierra'],
      animation: 'steam'
    })
  }

  /**
   * Validate offering catalog using MCP cultural validation
   */
  async validateOfferingCatalog() {
    console.log('🔍 Validating offering catalog culturally...')
    
    try {
      const offeringTypes = Array.from(this.offeringCatalog.keys())
      const validation = await MCPService.validateOfferingTypes(offeringTypes)
      
      if (validation.invalidOfferings.length > 0) {
        console.warn('Some offerings may not be culturally appropriate:', validation.invalidOfferings)
        
        // Remove invalid offerings from catalog
        validation.invalidOfferings.forEach(invalidType => {
          this.offeringCatalog.delete(invalidType)
        })
      }
      
      if (validation.suggestions.length > 0) {
        console.log('Cultural suggestions for offerings:', validation.suggestions)
      }
      
      console.log('✅ Offering catalog validated')
    } catch (error) {
      console.warn('Cultural validation failed, proceeding with default catalog:', error)
    }
  }

  /**
   * Create 3D models for offerings
   */
  async createOfferingModels() {
    console.log('🎨 Creating offering models...')
    
    for (const [type, data] of this.offeringCatalog) {
      const model = await this.createOfferingModel(type, data)
      this.offeringModels.set(type, model)
    }
  }

  /**
   * Create individual offering model
   */
  async createOfferingModel(type, data) {
    let geometry, material
    
    switch (type) {
      case 'cempasuchil':
        geometry = this.createFlowerGeometry()
        material = new THREE.MeshLambertMaterial({ 
          color: data.color,
          transparent: true,
          opacity: 0.9
        })
        break
        
      case 'pan_de_muerto':
        geometry = this.createBreadGeometry()
        material = new THREE.MeshLambertMaterial({ color: data.color })
        break
        
      case 'agua':
        geometry = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 8)
        material = new THREE.MeshPhongMaterial({ 
          color: data.color,
          transparent: true,
          opacity: 0.7,
          shininess: 100
        })
        break
        
      case 'sal':
        geometry = new THREE.BoxGeometry(0.12, 0.05, 0.12)
        material = new THREE.MeshLambertMaterial({ 
          color: data.color,
          transparent: true,
          opacity: 0.8
        })
        break
        
      case 'vela':
        geometry = this.createCandleGeometry()
        material = new THREE.MeshLambertMaterial({ color: data.color })
        break
        
      case 'incienso':
        geometry = new THREE.CylinderGeometry(0.015, 0.015, 0.15, 6)
        material = new THREE.MeshLambertMaterial({ color: data.color })
        break
        
      case 'foto':
        geometry = new THREE.PlaneGeometry(0.15, 0.2)
        material = new THREE.MeshLambertMaterial({ 
          color: data.color,
          transparent: true,
          opacity: 0.9
        })
        break
        
      case 'comida_favorita':
        geometry = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 8)
        material = new THREE.MeshLambertMaterial({ color: data.color })
        break
        
      default:
        geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1)
        material = new THREE.MeshLambertMaterial({ color: data.color })
    }
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.userData = { type, data, interactive: true }
    mesh.castShadow = true
    mesh.receiveShadow = true
    
    return mesh
  }

  /**
   * Create flower geometry for cempasúchil
   */
  createFlowerGeometry() {
    const group = new THREE.Group()
    
    // Create petals
    const petalGeometry = new THREE.SphereGeometry(0.03, 8, 8)
    const petalMaterial = new THREE.MeshLambertMaterial({ color: 0xFFA500 })
    
    for (let i = 0; i < 12; i++) {
      const petal = new THREE.Mesh(petalGeometry, petalMaterial)
      const angle = (i / 12) * Math.PI * 2
      petal.position.set(
        Math.cos(angle) * 0.06,
        0,
        Math.sin(angle) * 0.06
      )
      petal.scale.set(0.8, 0.4, 0.8)
      group.add(petal)
    }
    
    // Center
    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 8, 8),
      new THREE.MeshLambertMaterial({ color: 0xFF8C00 })
    )
    group.add(center)
    
    return group
  }

  /**
   * Create bread geometry for pan de muerto
   */
  createBreadGeometry() {
    const group = new THREE.Group()
    
    // Main bread body
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 8),
      new THREE.MeshLambertMaterial({ color: 0xD2691E })
    )
    body.scale.y = 0.6
    group.add(body)
    
    // Bone decorations
    const boneGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.06, 6)
    const boneMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 })
    
    for (let i = 0; i < 4; i++) {
      const bone = new THREE.Mesh(boneGeometry, boneMaterial)
      const angle = (i / 4) * Math.PI * 2
      bone.position.set(
        Math.cos(angle) * 0.05,
        0.02,
        Math.sin(angle) * 0.05
      )
      bone.rotation.y = angle
      group.add(bone)
    }
    
    return group
  }

  /**
   * Create candle geometry
   */
  createCandleGeometry() {
    const group = new THREE.Group()
    
    // Candle body
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.15, 8),
      new THREE.MeshLambertMaterial({ color: 0xFFFACD })
    )
    group.add(body)
    
    // Flame
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.015, 6, 8),
      new THREE.MeshBasicMaterial({ 
        color: 0xFFAA00,
        transparent: true,
        opacity: 0.8
      })
    )
    flame.position.y = 0.09
    flame.scale.y = 1.5
    group.add(flame)
    
    return group
  }

  /**
   * Setup placement surfaces (altar levels)
   */
  setupPlacementSurfaces() {
    // Create invisible surfaces for each altar level
    const levels = [
      { name: 'tierra', y: 0.1, size: { width: 4, depth: 3 } },
      { name: 'purgatorio', y: 1.6, size: { width: 3.5, depth: 2.5 } },
      { name: 'cielo', y: 3.1, size: { width: 3, depth: 2 } }
    ]
    
    levels.forEach(level => {
      const surfaceGeometry = new THREE.PlaneGeometry(level.size.width, level.size.depth)
      const surfaceMaterial = new THREE.MeshBasicMaterial({ 
        transparent: true, 
        opacity: 0,
        visible: false
      })
      
      const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial)
      surface.rotation.x = -Math.PI / 2
      surface.position.y = level.y
      surface.userData = { 
        type: 'placement-surface',
        level: level.name
      }
      
      this.altarGroup.add(surface)
      this.placementSurfaces.push(surface)
    })
  }

  /**
   * Setup animation system
   */
  setupAnimationSystem() {
    this.animationMixer = new THREE.AnimationMixer(this.altarGroup)
    
    const animate = () => {
      const delta = this.clock.getDelta()
      if (this.animationMixer) {
        this.animationMixer.update(delta)
      }
      
      // Update offering animations
      this.updateOfferingAnimations()
      
      requestAnimationFrame(animate)
    }
    animate()
  }

  /**
   * Update offering animations
   */
  updateOfferingAnimations() {
    const time = Date.now() * 0.001
    
    this.placedOfferings.forEach((offering, id) => {
      const animationType = offering.userData.data.animation
      
      switch (animationType) {
        case 'sway':
          offering.rotation.z = Math.sin(time * 2 + offering.position.x) * 0.1
          break
          
        case 'flicker':
          const flame = offering.children.find(child => 
            child.material && child.material.color.getHex() === 0xFFAA00
          )
          if (flame) {
            flame.scale.y = 1.5 + Math.sin(time * 8) * 0.3
            flame.material.opacity = 0.8 + Math.sin(time * 12) * 0.2
          }
          break
          
        case 'shimmer':
          if (offering.material.shininess !== undefined) {
            offering.material.shininess = 100 + Math.sin(time * 4) * 50
          }
          break
          
        case 'sparkle':
          offering.material.opacity = 0.8 + Math.sin(time * 6) * 0.2
          break
          
        case 'glow':
          if (offering.material.emissive) {
            const intensity = 0.1 + Math.sin(time * 3) * 0.05
            offering.material.emissive.setScalar(intensity)
          }
          break
          
        case 'smoke':
          // Simple smoke effect with particles would go here
          offering.rotation.y += 0.01
          break
          
        case 'steam':
          offering.position.y += Math.sin(time * 4 + offering.position.x) * 0.002
          break
      }
    })
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for offering placement requests
    document.addEventListener('place-offering', (event) => {
      this.startPlacementMode(event.detail.type, event.detail.memorialId)
    })
    
    // Listen for offering catalog requests
    document.addEventListener('show-offering-catalog', () => {
      this.showOfferingCatalog()
    })
  }

  /**
   * Show offering catalog UI
   */
  showOfferingCatalog() {
    const catalogData = Array.from(this.offeringCatalog.entries()).map(([type, data]) => ({
      type,
      ...data
    }))
    
    const event = new CustomEvent('display-offering-catalog', {
      detail: { catalog: catalogData }
    })
    document.dispatchEvent(event)
  }

  /**
   * Start placement mode for an offering
   */
  startPlacementMode(offeringType, memorialId = null) {
    if (!this.offeringCatalog.has(offeringType)) {
      console.error('Unknown offering type:', offeringType)
      return
    }
    
    console.log(`🎯 Starting placement mode for ${offeringType}`)
    
    this.placementMode = true
    this.selectedOfferingType = offeringType
    this.selectedMemorialId = memorialId
    
    // Create placement preview
    this.createPlacementPreview(offeringType)
    
    // Show placement instructions
    this.showPlacementInstructions()
    
    // Add event listeners for placement
    this.addPlacementListeners()
  }

  /**
   * Create placement preview
   */
  createPlacementPreview(offeringType) {
    const model = this.offeringModels.get(offeringType)
    if (!model) return
    
    this.placementPreview = model.clone()
    this.placementPreview.material = this.placementPreview.material.clone()
    this.placementPreview.material.transparent = true
    this.placementPreview.material.opacity = 0.5
    this.placementPreview.material.color.setHex(0x00FF00)
    
    this.scene.add(this.placementPreview)
  }

  /**
   * Show placement instructions
   */
  showPlacementInstructions() {
    const offeringData = this.offeringCatalog.get(this.selectedOfferingType)
    const validLevels = offeringData.placement.join(', ')
    
    appState.actions.showNotification({
      type: 'info',
      title: `Colocando ${offeringData.name}`,
      message: `Toca en el altar para colocar la ofrenda. Niveles válidos: ${validLevels}`,
      persistent: true
    })
  }

  /**
   * Add placement event listeners
   */
  addPlacementListeners() {
    this.placementClickHandler = this.onPlacementClick.bind(this)
    this.placementMoveHandler = this.onPlacementMove.bind(this)
    this.placementCancelHandler = this.onPlacementCancel.bind(this)
    
    document.addEventListener('click', this.placementClickHandler)
    document.addEventListener('mousemove', this.placementMoveHandler)
    document.addEventListener('keydown', this.placementCancelHandler)
  }

  /**
   * Handle placement click
   */
  onPlacementClick(event) {
    if (!this.placementMode) return
    
    event.preventDefault()
    
    // Calculate mouse position
    const rect = event.target.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    // Raycast to find placement surface
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.placementSurfaces)
    
    if (intersects.length > 0) {
      const intersection = intersects[0]
      const surface = intersection.object
      const level = surface.userData.level
      
      // Check if offering can be placed on this level
      const offeringData = this.offeringCatalog.get(this.selectedOfferingType)
      if (offeringData.placement.includes(level)) {
        this.placeOffering(intersection.point, level)
      } else {
        appState.actions.showNotification({
          type: 'warning',
          title: 'Ubicación no válida',
          message: `${offeringData.name} no puede colocarse en el ${level}`
        })
      }
    }
  }

  /**
   * Handle placement mouse move
   */
  onPlacementMove(event) {
    if (!this.placementMode || !this.placementPreview) return
    
    // Update preview position
    const rect = event.target.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.placementSurfaces)
    
    if (intersects.length > 0) {
      const point = intersects[0].point
      this.placementPreview.position.copy(point)
      this.placementPreview.position.y += 0.05 // Slight elevation
      
      // Change color based on validity
      const level = intersects[0].object.userData.level
      const offeringData = this.offeringCatalog.get(this.selectedOfferingType)
      const isValid = offeringData.placement.includes(level)
      
      this.placementPreview.material.color.setHex(isValid ? 0x00FF00 : 0xFF0000)
    }
  }

  /**
   * Handle placement cancellation
   */
  onPlacementCancel(event) {
    if (event.key === 'Escape') {
      this.cancelPlacement()
    }
  }

  /**
   * Place offering at specified position
   */
  async placeOffering(position, level) {
    const offeringModel = this.offeringModels.get(this.selectedOfferingType)
    if (!offeringModel) return
    
    try {
      // Validate cultural appropriateness of placement
      const placementContext = `Colocando ${this.selectedOfferingType} en el nivel ${level} del altar de muertos`
      const culturalValidation = await MCPService.validateTradition(placementContext, 'offering_placement')
      
      if (!culturalValidation.isValid) {
        appState.actions.showNotification({
          type: 'warning',
          title: 'Colocación no apropiada',
          message: culturalValidation.suggestions.length > 0 ? 
            culturalValidation.suggestions[0] : 
            'Esta colocación puede no ser culturalmente apropiada'
        })
        
        // Still allow placement but with warning
        console.warn('Cultural validation warning for offering placement:', culturalValidation)
      }
    } catch (error) {
      console.warn('Cultural validation failed for offering placement:', error)
    }
    
    // Create offering instance
    const offering = offeringModel.clone()
    offering.position.copy(position)
    offering.position.y += 0.02 // Slight elevation above surface
    
    // Add random slight rotation for natural look
    offering.rotation.y = Math.random() * Math.PI * 2
    
    // Store offering data
    const offeringId = `offering_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    offering.userData = {
      ...offering.userData,
      id: offeringId,
      level: level,
      memorialId: this.selectedMemorialId,
      placedAt: new Date()
    }
    
    // Add to scene and tracking
    this.altarGroup.add(offering)
    this.placedOfferings.set(offeringId, offering)
    
    // Update app state
    const offeringData = {
      id: offeringId,
      type: this.selectedOfferingType,
      position: { x: position.x, y: position.y, z: position.z },
      level: level,
      memorialId: this.selectedMemorialId,
      placedAt: new Date()
    }
    
    appState.push('arSession.offerings', offeringData)
    
    // Show success message
    const catalogData = this.offeringCatalog.get(this.selectedOfferingType)
    appState.actions.showNotification({
      type: 'success',
      title: 'Ofrenda colocada',
      message: `${catalogData.name} colocada en el ${level}`
    })
    
    console.log(`✅ Placed ${this.selectedOfferingType} at ${level}`)
    
    // End placement mode
    this.endPlacementMode()
  }

  /**
   * Cancel placement mode
   */
  cancelPlacement() {
    console.log('❌ Placement cancelled')
    this.endPlacementMode()
  }

  /**
   * End placement mode
   */
  endPlacementMode() {
    this.placementMode = false
    this.selectedOfferingType = null
    this.selectedMemorialId = null
    
    // Remove preview
    if (this.placementPreview) {
      this.scene.remove(this.placementPreview)
      this.placementPreview = null
    }
    
    // Remove event listeners
    if (this.placementClickHandler) {
      document.removeEventListener('click', this.placementClickHandler)
      document.removeEventListener('mousemove', this.placementMoveHandler)
      document.removeEventListener('keydown', this.placementCancelHandler)
    }
    
    // Clear notifications
    appState.set('ui.notifications', [])
  }

  /**
   * Remove offering
   */
  removeOffering(offeringId) {
    const offering = this.placedOfferings.get(offeringId)
    if (offering) {
      this.altarGroup.remove(offering)
      this.placedOfferings.delete(offeringId)
      
      // Update app state
      appState.remove('arSession.offerings', o => o.id === offeringId)
      
      console.log(`🗑️ Removed offering ${offeringId}`)
    }
  }

  /**
   * Get offerings for specific memorial
   */
  getOfferingsForMemorial(memorialId) {
    const offerings = []
    this.placedOfferings.forEach((offering, id) => {
      if (offering.userData.memorialId === memorialId) {
        offerings.push({
          id,
          type: offering.userData.type,
          position: offering.position,
          level: offering.userData.level
        })
      }
    })
    return offerings
  }

  /**
   * Get all placed offerings
   */
  getAllOfferings() {
    const offerings = []
    this.placedOfferings.forEach((offering, id) => {
      offerings.push({
        id,
        type: offering.userData.type,
        position: offering.position,
        level: offering.userData.level,
        memorialId: offering.userData.memorialId
      })
    })
    return offerings
  }

  /**
   * Load offerings from saved data
   */
  loadOfferings(offeringsData) {
    offeringsData.forEach(data => {
      const model = this.offeringModels.get(data.type)
      if (model) {
        const offering = model.clone()
        offering.position.set(data.position.x, data.position.y, data.position.z)
        offering.userData = {
          ...offering.userData,
          id: data.id,
          level: data.level,
          memorialId: data.memorialId,
          placedAt: new Date(data.placedAt)
        }
        
        this.altarGroup.add(offering)
        this.placedOfferings.set(data.id, offering)
      }
    })
    
    console.log(`📦 Loaded ${offeringsData.length} offerings`)
  }

  /**
   * Clear all offerings
   */
  clearAllOfferings() {
    this.placedOfferings.forEach((offering, id) => {
      this.altarGroup.remove(offering)
    })
    
    this.placedOfferings.clear()
    appState.set('arSession.offerings', [])
    
    console.log('🧹 Cleared all offerings')
  }

  /**
   * Get offering catalog for UI
   */
  getCatalog() {
    return Array.from(this.offeringCatalog.entries()).map(([type, data]) => ({
      type,
      ...data
    }))
  }

  /**
   * Cleanup resources
   */
  dispose() {
    // End placement mode if active
    if (this.placementMode) {
      this.endPlacementMode()
    }
    
    // Clear all offerings
    this.clearAllOfferings()
    
    // Stop animations
    if (this.animationMixer) {
      this.animationMixer.stopAllAction()
    }
    
    // Remove placement surfaces
    this.placementSurfaces.forEach(surface => {
      this.altarGroup.remove(surface)
    })
    
    // Clear maps
    this.offeringCatalog.clear()
    this.offeringModels.clear()
    this.placedOfferings.clear()
    
    console.log('🧹 Virtual offerings component disposed')
  }
}
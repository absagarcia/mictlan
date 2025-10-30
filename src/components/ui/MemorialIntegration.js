/**
 * Memorial Integration Component
 * Connects Memory Book entries to AR altar visualization
 */

import { appState } from '../../state/AppState.js'
import { i18n } from '../../i18n/i18n.js'
import { Modal } from './Modal.js'

export class MemorialIntegration {
  constructor() {
    this.memorials = []
    this.altarLevels = new Map()
    this.isInitialized = false
    this.arScene = null
    this.memorialObjects = new Map()
  }

  /**
   * Initialize memorial integration
   */
  async init(arScene = null) {
    if (this.isInitialized) return

    console.log('🔗 Initializing Memorial Integration...')

    try {
      this.arScene = arScene
      this.memorials = appState.get('memorials') || []
      
      // Initialize altar levels
      this.initializeAltarLevels()
      
      // Setup event listeners
      this.setupEventListeners()
      
      // Load memorials into AR if scene is available
      if (this.arScene) {
        await this.loadMemorialsIntoAR()
      }
      
      this.isInitialized = true
      console.log('✅ Memorial Integration initialized')
      
    } catch (error) {
      console.error('❌ Failed to initialize Memorial Integration:', error)
      throw error
    }
  }

  /**
   * Initialize altar levels configuration
   */
  initializeAltarLevels() {
    this.altarLevels.set(1, {
      name: 'Tierra',
      description: 'Nivel terrenal - Recuerdos de la vida cotidiana',
      position: { x: 0, y: 0, z: 0 },
      memorials: [],
      maxMemorials: 6
    })

    this.altarLevels.set(2, {
      name: 'Purgatorio', 
      description: 'Nivel intermedio - Transición y reflexión',
      position: { x: 0, y: 1.5, z: 0 },
      memorials: [],
      maxMemorials: 4
    })

    this.altarLevels.set(3, {
      name: 'Cielo',
      description: 'Nivel celestial - Paz eterna y sabiduría',
      position: { x: 0, y: 3, z: 0 },
      memorials: [],
      maxMemorials: 3
    })
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for memorial changes
    appState.subscribe('memorials', (memorials) => {
      this.memorials = memorials
      this.updateMemorialDistribution()
      
      if (this.arScene) {
        this.updateMemorialsInAR()
      }
    })

    // Listen for AR scene changes
    appState.subscribe('arSession.scene', (scene) => {
      this.arScene = scene
      if (scene && this.memorials.length > 0) {
        this.loadMemorialsIntoAR()
      }
    })

    // Listen for family tree memorial selection
    document.addEventListener('family-tree-memorial-selected', (event) => {
      this.highlightMemorialInAR(event.detail.memorial)
    })

    // Listen for view memorial in AR requests
    document.addEventListener('view-memorial-in-ar', (event) => {
      this.focusMemorialInAR(event.detail.memorial)
    })

    // Listen for family connections visualization
    document.addEventListener('show-family-connections-ar', (event) => {
      this.showFamilyConnectionsInAR(event.detail)
    })

    // Listen for generation highlighting
    document.addEventListener('highlight-generation-ar', (event) => {
      this.highlightGenerationInAR(event.detail)
    })

    // Listen for family path visualization
    document.addEventListener('show-family-path-ar', (event) => {
      this.showFamilyPathInAR(event.detail)
    })
  }

  /**
   * Update memorial distribution across altar levels
   */
  updateMemorialDistribution() {
    // Clear existing distributions
    this.altarLevels.forEach(level => {
      level.memorials = []
    })

    // Distribute memorials based on relationship and age
    this.memorials.forEach(memorial => {
      const level = this.determineAltarLevel(memorial)
      const altarLevel = this.altarLevels.get(level)
      
      if (altarLevel && altarLevel.memorials.length < altarLevel.maxMemorials) {
        altarLevel.memorials.push(memorial)
        memorial.altarLevel = level
      } else {
        // Find alternative level if preferred is full
        const alternativeLevel = this.findAlternativeLevel(memorial)
        if (alternativeLevel) {
          alternativeLevel.memorials.push(memorial)
          memorial.altarLevel = Array.from(this.altarLevels.entries())
            .find(([_, level]) => level === alternativeLevel)[0]
        }
      }
    })
  }

  /**
   * Determine appropriate altar level for memorial
   */
  determineAltarLevel(memorial) {
    const relationship = memorial.relationship?.toLowerCase() || ''
    const age = this.calculateAge(memorial)
    
    // Grandparents and great-grandparents go to heaven level
    if (relationship.includes('abuelo') || relationship.includes('abuela') || 
        relationship.includes('bisabuelo') || relationship.includes('bisabuela')) {
      return 3
    }
    
    // Parents and older relatives go to purgatory level
    if (relationship.includes('padre') || relationship.includes('madre') ||
        relationship.includes('tio') || relationship.includes('tia') ||
        age > 60) {
      return 2
    }
    
    // Siblings, children, and younger relatives go to earth level
    return 1
  }

  /**
   * Find alternative level if preferred is full
   */
  findAlternativeLevel(memorial) {
    // Try levels in order of preference
    for (let level = 1; level <= 3; level++) {
      const altarLevel = this.altarLevels.get(level)
      if (altarLevel && altarLevel.memorials.length < altarLevel.maxMemorials) {
        return altarLevel
      }
    }
    return null
  }

  /**
   * Calculate age from memorial data
   */
  calculateAge(memorial) {
    if (!memorial.birthDate || !memorial.deathDate) return 0
    
    const birth = new Date(memorial.birthDate)
    const death = new Date(memorial.deathDate)
    
    return death.getFullYear() - birth.getFullYear()
  }

  /**
   * Load memorials into AR scene
   */
  async loadMemorialsIntoAR() {
    if (!this.arScene) return

    console.log('🕯️ Loading memorials into AR altar...')

    // Clear existing memorial objects
    this.clearMemorialObjects()

    // Create memorial objects for each level
    for (const [levelNumber, level] of this.altarLevels) {
      await this.createLevelMemorials(levelNumber, level)
    }

    console.log(`✅ Loaded ${this.memorials.length} memorials into AR altar`)
  }

  /**
   * Create memorial objects for a specific level
   */
  async createLevelMemorials(levelNumber, level) {
    const memorials = level.memorials
    if (memorials.length === 0) return

    const levelPosition = level.position
    const radius = 1.2 // Distance from center
    const angleStep = (Math.PI * 2) / Math.max(memorials.length, 3)

    memorials.forEach((memorial, index) => {
      const angle = index * angleStep
      const position = {
        x: levelPosition.x + Math.cos(angle) * radius,
        y: levelPosition.y,
        z: levelPosition.z + Math.sin(angle) * radius
      }

      const memorialObject = this.createMemorialObject(memorial, position, levelNumber)
      this.memorialObjects.set(memorial.id, memorialObject)
      
      // Add to AR scene
      if (this.arScene.add) {
        this.arScene.add(memorialObject)
      }
    })
  }

  /**
   * Create 3D memorial object
   */
  createMemorialObject(memorial, position, level) {
    // This would typically use Three.js to create 3D objects
    // For now, we'll create a placeholder object structure
    const memorialObject = {
      id: memorial.id,
      memorial: memorial,
      position: position,
      level: level,
      type: 'memorial',
      visible: true,
      highlighted: false,
      
      // Placeholder for 3D object properties
      geometry: null,
      material: null,
      mesh: null,
      
      // Memorial-specific properties
      photoTexture: null,
      nameLabel: null,
      interactionZone: null,
      
      // Methods
      show: () => {
        memorialObject.visible = true
        // Update 3D object visibility
      },
      
      hide: () => {
        memorialObject.visible = false
        // Update 3D object visibility
      },
      
      highlight: (color = '#FFD700') => {
        memorialObject.highlighted = true
        // Update 3D object highlighting
      },
      
      unhighlight: () => {
        memorialObject.highlighted = false
        // Remove 3D object highlighting
      },
      
      onClick: () => {
        this.showMemorialDetails(memorial)
      }
    }

    // Load photo texture if available
    if (memorial.photo) {
      this.loadPhotoTexture(memorial.photo).then(texture => {
        memorialObject.photoTexture = texture
        // Apply texture to 3D object
      })
    }

    return memorialObject
  }

  /**
   * Load photo texture for memorial
   */
  async loadPhotoTexture(photoUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        // Create canvas texture
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        canvas.width = 256
        canvas.height = 256
        
        // Draw image with rounded corners
        ctx.beginPath()
        ctx.roundRect(0, 0, 256, 256, 20)
        ctx.clip()
        ctx.drawImage(img, 0, 0, 256, 256)
        
        resolve(canvas)
      }
      
      img.onerror = reject
      img.src = photoUrl
    })
  }

  /**
   * Update memorials in AR
   */
  updateMemorialsInAR() {
    if (!this.arScene) return

    // Remove old memorial objects
    this.clearMemorialObjects()
    
    // Reload memorials
    this.loadMemorialsIntoAR()
  }

  /**
   * Clear memorial objects from AR scene
   */
  clearMemorialObjects() {
    this.memorialObjects.forEach(memorialObject => {
      if (this.arScene.remove) {
        this.arScene.remove(memorialObject)
      }
    })
    this.memorialObjects.clear()
  }

  /**
   * Highlight memorial in AR
   */
  highlightMemorialInAR(memorial) {
    // Unhighlight all memorials
    this.memorialObjects.forEach(obj => obj.unhighlight())
    
    // Highlight selected memorial
    const memorialObject = this.memorialObjects.get(memorial.id)
    if (memorialObject) {
      memorialObject.highlight('#FFD700')
      
      // Focus camera on memorial
      this.focusMemorialInAR(memorial)
    }
  }

  /**
   * Focus memorial in AR view
   */
  focusMemorialInAR(memorial) {
    const memorialObject = this.memorialObjects.get(memorial.id)
    if (!memorialObject) return

    // Dispatch event for AR camera to focus on memorial
    document.dispatchEvent(new CustomEvent('ar-focus-memorial', {
      detail: {
        memorial: memorial,
        position: memorialObject.position,
        level: memorialObject.level
      }
    }))

    // Show memorial details
    this.showMemorialDetails(memorial)
  }

  /**
   * Show family connections in AR
   */
  showFamilyConnectionsInAR(data) {
    const { centerMemorial, connectedMemorials, relationships } = data
    
    // Highlight center memorial
    this.highlightMemorialInAR(centerMemorial)
    
    // Highlight connected memorials with different color
    connectedMemorials.forEach(memorial => {
      const memorialObject = this.memorialObjects.get(memorial.id)
      if (memorialObject) {
        memorialObject.highlight('#FF6B35') // Orange for connections
      }
    })
    
    // Create connection lines (would be implemented with Three.js)
    this.createConnectionLines(centerMemorial, connectedMemorials, relationships)
    
    console.log(`🔗 Showing family connections for ${centerMemorial.name}`)
  }

  /**
   * Highlight generation in AR
   */
  highlightGenerationInAR(data) {
    const { generation, memorials } = data
    
    // Unhighlight all memorials
    this.memorialObjects.forEach(obj => obj.unhighlight())
    
    // Highlight generation memorials
    memorials.forEach(memorial => {
      const memorialObject = this.memorialObjects.get(memorial.id)
      if (memorialObject) {
        memorialObject.highlight('#7C3AED') // Purple for generation
      }
    })
    
    console.log(`👥 Highlighting generation ${generation + 1} in AR`)
  }

  /**
   * Show family path in AR
   */
  showFamilyPathInAR(data) {
    const { targetMemorial, genealogicalPath } = data
    
    // Unhighlight all memorials
    this.memorialObjects.forEach(obj => obj.unhighlight())
    
    // Highlight path memorials in sequence
    genealogicalPath.forEach((memorial, index) => {
      const memorialObject = this.memorialObjects.get(memorial.id)
      if (memorialObject) {
        // Use gradient color from green to gold
        const intensity = index / (genealogicalPath.length - 1)
        const color = this.interpolateColor('#10B981', '#FFD700', intensity)
        memorialObject.highlight(color)
      }
    })
    
    // Create path lines
    this.createPathLines(genealogicalPath)
    
    console.log(`🛤️ Showing family path to ${targetMemorial.name}`)
  }

  /**
   * Create connection lines between memorials
   */
  createConnectionLines(centerMemorial, connectedMemorials, relationships) {
    // This would be implemented with Three.js line geometry
    // For now, we'll just log the connections
    console.log('Creating connection lines:', {
      center: centerMemorial.name,
      connections: connectedMemorials.map(m => m.name)
    })
  }

  /**
   * Create path lines for genealogical path
   */
  createPathLines(genealogicalPath) {
    // This would be implemented with Three.js line geometry
    console.log('Creating path lines:', genealogicalPath.map(m => m.name))
  }

  /**
   * Interpolate between two colors
   */
  interpolateColor(color1, color2, factor) {
    // Simple color interpolation
    return factor < 0.5 ? color1 : color2
  }

  /**
   * Show memorial details modal
   */
  showMemorialDetails(memorial) {
    const modal = new Modal({
      title: memorial.name,
      size: 'large',
      content: this.generateMemorialDetailsContent(memorial)
    })
    
    modal.show()
  }

  /**
   * Generate memorial details content
   */
  generateMemorialDetailsContent(memorial) {
    const altarLevel = this.altarLevels.get(memorial.altarLevel)
    const age = this.calculateAge(memorial)
    
    return `
      <div class="memorial-details-ar">
        <div class="memorial-header">
          ${memorial.photo ? `
            <div class="memorial-photo-container">
              <img src="${memorial.photo}" alt="${memorial.name}" class="memorial-photo">
            </div>
          ` : ''}
          
          <div class="memorial-info">
            <h3 class="memorial-name">${memorial.name}</h3>
            <p class="memorial-relationship">${i18n.t(`relationships.${memorial.relationship}`) || memorial.relationship}</p>
            
            ${memorial.birthDate || memorial.deathDate ? `
              <div class="memorial-dates">
                ${memorial.birthDate ? `
                  <span class="birth-date">
                    📅 ${new Date(memorial.birthDate).toLocaleDateString()}
                  </span>
                ` : ''}
                ${memorial.deathDate ? `
                  <span class="death-date">
                    🕊️ ${new Date(memorial.deathDate).toLocaleDateString()}
                  </span>
                ` : ''}
                ${age > 0 ? `<span class="age">(${age} años)</span>` : ''}
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="altar-placement">
          <h4>🕯️ Ubicación en el Altar</h4>
          <div class="altar-level-info">
            <span class="level-name">${altarLevel?.name || 'No asignado'}</span>
            <p class="level-description">${altarLevel?.description || ''}</p>
          </div>
        </div>
        
        ${memorial.story ? `
          <div class="memorial-story">
            <h4>📖 Historia</h4>
            <p>${memorial.story}</p>
          </div>
        ` : ''}
        
        ${memorial.audioMessage ? `
          <div class="memorial-audio">
            <h4>🎵 Mensaje de Audio</h4>
            <audio controls>
              <source src="${memorial.audioMessage}" type="audio/mpeg">
              Tu navegador no soporta audio.
            </audio>
          </div>
        ` : ''}
        
        <div class="ar-actions">
          <button class="btn btn-primary focus-memorial-btn" data-memorial-id="${memorial.id}">
            🎯 Enfocar en AR
          </button>
          <button class="btn btn-outline show-connections-btn" data-memorial-id="${memorial.id}">
            🔗 Mostrar Conexiones
          </button>
          <button class="btn btn-outline edit-memorial-btn" data-memorial-id="${memorial.id}">
            ✏️ Editar Memorial
          </button>
        </div>
      </div>
    `
  }

  /**
   * Get memorial by ID
   */
  getMemorial(id) {
    return this.memorials.find(m => m.id === id)
  }

  /**
   * Get memorials by level
   */
  getMemorialsByLevel(level) {
    const altarLevel = this.altarLevels.get(level)
    return altarLevel ? altarLevel.memorials : []
  }

  /**
   * Get all memorial objects in AR
   */
  getMemorialObjects() {
    return Array.from(this.memorialObjects.values())
  }

  /**
   * Dispose memorial integration
   */
  dispose() {
    this.clearMemorialObjects()
    this.memorialObjects.clear()
    this.altarLevels.clear()
    this.isInitialized = false
    console.log('🧹 Memorial Integration disposed')
  }
}

// Create singleton instance
export const memorialIntegration = new MemorialIntegration()
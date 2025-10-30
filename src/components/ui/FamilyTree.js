/**
 * Family Tree Component
 * Visualizes generational connections and family relationships
 */

import { appState } from '../../state/AppState.js'
import { i18n } from '../../i18n/i18n.js'

export class FamilyTree {
  constructor(container) {
    this.container = container
    this.memorials = []
    this.relationships = new Map()
    this.selectedMemorial = null
    this.isInitialized = false
    this.svgElement = null
    this.generations = new Map()
  }

  /**
   * Initialize the family tree
   */
  async init() {
    if (this.isInitialized) return

    console.log('🌳 Initializing Family Tree Component...')

    try {
      // Load memorials from app state
      this.memorials = appState.get('memorials') || []
      
      // Build relationship map
      this.buildRelationshipMap()
      
      // Calculate generations
      this.calculateGenerations()
      
      // Render the tree
      this.render()
      
      // Setup event listeners
      this.setupEventListeners()
      
      this.isInitialized = true
      console.log('✅ Family Tree Component initialized')
      
    } catch (error) {
      console.error('❌ Failed to initialize Family Tree Component:', error)
      throw error
    }
  }

  /**
   * Build relationship map from memorial data
   */
  buildRelationshipMap() {
    this.relationships.clear()
    
    this.memorials.forEach(memorial => {
      if (memorial.familyConnections) {
        this.relationships.set(memorial.id, {
          memorial,
          parents: memorial.familyConnections.parents || [],
          children: memorial.familyConnections.children || [],
          spouse: memorial.familyConnections.spouse || null
        })
      } else {
        // Create basic relationship entry
        this.relationships.set(memorial.id, {
          memorial,
          parents: [],
          children: [],
          spouse: null
        })
      }
    })
  }

  /**
   * Calculate generation levels for each memorial
   */
  calculateGenerations() {
    this.generations.clear()
    const visited = new Set()
    
    // Find root nodes (people with no parents)
    const roots = []
    this.relationships.forEach((data, id) => {
      if (data.parents.length === 0) {
        roots.push(id)
      }
    })
    
    // If no clear roots, use oldest person as root
    if (roots.length === 0 && this.memorials.length > 0) {
      const oldest = this.memorials.reduce((oldest, current) => {
        const oldestBirth = oldest.birthDate ? new Date(oldest.birthDate) : new Date(1900, 0, 1)
        const currentBirth = current.birthDate ? new Date(current.birthDate) : new Date(1900, 0, 1)
        return currentBirth < oldestBirth ? current : oldest
      })
      roots.push(oldest.id)
    }
    
    // Assign generation levels using BFS
    const queue = roots.map(id => ({ id, generation: 0 }))
    
    while (queue.length > 0) {
      const { id, generation } = queue.shift()
      
      if (visited.has(id)) continue
      visited.add(id)
      
      this.generations.set(id, generation)
      
      // Add children to queue
      const relationshipData = this.relationships.get(id)
      if (relationshipData) {
        relationshipData.children.forEach(childId => {
          if (!visited.has(childId)) {
            queue.push({ id: childId, generation: generation + 1 })
          }
        })
      }
    }
    
    // Handle unconnected nodes
    this.relationships.forEach((data, id) => {
      if (!this.generations.has(id)) {
        this.generations.set(id, 0)
      }
    })
  }

  /**
   * Render the family tree
   */
  render() {
    if (!this.container) return

    this.container.innerHTML = `
      <div class="family-tree">
        <div class="family-tree-header">
          <h2>${i18n.t('coco.family_tree')}</h2>
          <div class="tree-controls">
            <button class="zoom-in-btn" aria-label="Acercar">🔍+</button>
            <button class="zoom-out-btn" aria-label="Alejar">🔍-</button>
            <button class="center-tree-btn" aria-label="Centrar">🎯</button>
            <button class="toggle-view-btn" aria-label="Cambiar vista">📊</button>
          </div>
        </div>
        
        <div class="family-tree-container">
          <svg class="family-tree-svg" id="family-tree-svg">
            <!-- Tree visualization will be rendered here -->
          </svg>
          
          <div class="tree-legend">
            <div class="legend-item">
              <div class="legend-color male"></div>
              <span>Masculino</span>
            </div>
            <div class="legend-item">
              <div class="legend-color female"></div>
              <span>Femenino</span>
            </div>
            <div class="legend-item">
              <div class="legend-line parent-child"></div>
              <span>Padre/Hijo</span>
            </div>
            <div class="legend-item">
              <div class="legend-line spouse"></div>
              <span>Matrimonio</span>
            </div>
          </div>
        </div>
        
        <div class="memorial-details" id="memorial-details" style="display: none;">
          <!-- Memorial details will be shown here -->
        </div>
      </div>
    `

    this.svgElement = document.getElementById('family-tree-svg')
    this.renderTreeVisualization()
  }

  /**
   * Render the tree visualization using SVG
   */
  renderTreeVisualization() {
    if (!this.svgElement || this.memorials.length === 0) return

    // Clear existing content
    this.svgElement.innerHTML = ''

    // Calculate layout
    const layout = this.calculateTreeLayout()
    
    // Set SVG dimensions
    this.svgElement.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`)
    this.svgElement.setAttribute('width', layout.width)
    this.svgElement.setAttribute('height', layout.height)

    // Create definitions for patterns and markers
    this.createSVGDefinitions()

    // Render connections first (so they appear behind nodes)
    this.renderConnections(layout)

    // Render memorial nodes
    this.renderMemorialNodes(layout)
  }

  /**
   * Calculate tree layout positions
   */
  calculateTreeLayout() {
    const nodeWidth = 120
    const nodeHeight = 80
    const horizontalSpacing = 160
    const verticalSpacing = 120
    
    // Group memorials by generation
    const generationGroups = new Map()
    let maxGeneration = 0
    
    this.generations.forEach((generation, memorialId) => {
      if (!generationGroups.has(generation)) {
        generationGroups.set(generation, [])
      }
      generationGroups.get(generation).push(memorialId)
      maxGeneration = Math.max(maxGeneration, generation)
    })

    // Calculate positions
    const positions = new Map()
    let maxWidth = 0

    generationGroups.forEach((memorialIds, generation) => {
      const generationWidth = memorialIds.length * horizontalSpacing
      maxWidth = Math.max(maxWidth, generationWidth)
      
      memorialIds.forEach((memorialId, index) => {
        const x = (index * horizontalSpacing) + (horizontalSpacing / 2)
        const y = (generation * verticalSpacing) + (verticalSpacing / 2)
        
        positions.set(memorialId, { x, y, width: nodeWidth, height: nodeHeight })
      })
    })

    return {
      positions,
      width: Math.max(maxWidth, 800),
      height: (maxGeneration + 1) * verticalSpacing + 100
    }
  }

  /**
   * Create SVG definitions for patterns and markers
   */
  createSVGDefinitions() {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    
    // Arrow marker for parent-child relationships
    const parentChildMarker = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
    parentChildMarker.setAttribute('id', 'parent-child-arrow')
    parentChildMarker.setAttribute('markerWidth', '10')
    parentChildMarker.setAttribute('markerHeight', '10')
    parentChildMarker.setAttribute('refX', '9')
    parentChildMarker.setAttribute('refY', '3')
    parentChildMarker.setAttribute('orient', 'auto')
    parentChildMarker.innerHTML = '<polygon points="0 0, 10 3, 0 6" fill="#666" />'
    
    // Heart marker for spouse relationships
    const spouseMarker = document.createElementNS('http://www.w3.org/2000/svg', 'marker')
    spouseMarker.setAttribute('id', 'spouse-heart')
    spouseMarker.setAttribute('markerWidth', '12')
    spouseMarker.setAttribute('markerHeight', '12')
    spouseMarker.setAttribute('refX', '6')
    spouseMarker.setAttribute('refY', '6')
    spouseMarker.innerHTML = '<text x="6" y="9" text-anchor="middle" font-size="10" fill="#e74c3c">♥</text>'
    
    defs.appendChild(parentChildMarker)
    defs.appendChild(spouseMarker)
    this.svgElement.appendChild(defs)
  }

  /**
   * Render connections between memorials
   */
  renderConnections(layout) {
    const connectionsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    connectionsGroup.setAttribute('class', 'connections')

    this.relationships.forEach((data, memorialId) => {
      const position = layout.positions.get(memorialId)
      if (!position) return

      // Parent-child connections
      data.children.forEach(childId => {
        const childPosition = layout.positions.get(childId)
        if (childPosition) {
          const line = this.createConnection(
            position.x + position.width / 2,
            position.y + position.height,
            childPosition.x + childPosition.width / 2,
            childPosition.y,
            'parent-child'
          )
          connectionsGroup.appendChild(line)
        }
      })

      // Spouse connections
      if (data.spouse) {
        const spousePosition = layout.positions.get(data.spouse)
        if (spousePosition) {
          const line = this.createConnection(
            position.x + position.width,
            position.y + position.height / 2,
            spousePosition.x,
            spousePosition.y + spousePosition.height / 2,
            'spouse'
          )
          connectionsGroup.appendChild(line)
        }
      }
    })

    this.svgElement.appendChild(connectionsGroup)
  }

  /**
   * Create a connection line between two points
   */
  createConnection(x1, y1, x2, y2, type) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('x1', x1)
    line.setAttribute('y1', y1)
    line.setAttribute('x2', x2)
    line.setAttribute('y2', y2)
    line.setAttribute('class', `connection ${type}`)
    
    if (type === 'parent-child') {
      line.setAttribute('stroke', '#666')
      line.setAttribute('stroke-width', '2')
      line.setAttribute('marker-end', 'url(#parent-child-arrow)')
    } else if (type === 'spouse') {
      line.setAttribute('stroke', '#e74c3c')
      line.setAttribute('stroke-width', '3')
      line.setAttribute('stroke-dasharray', '5,5')
      line.setAttribute('marker-mid', 'url(#spouse-heart)')
    }
    
    return line
  }

  /**
   * Render memorial nodes
   */
  renderMemorialNodes(layout) {
    const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    nodesGroup.setAttribute('class', 'memorial-nodes')

    layout.positions.forEach((position, memorialId) => {
      const memorial = this.memorials.find(m => m.id === memorialId)
      if (!memorial) return

      const nodeGroup = this.createMemorialNode(memorial, position)
      nodesGroup.appendChild(nodeGroup)
    })

    this.svgElement.appendChild(nodesGroup)
  }

  /**
   * Create a memorial node
   */
  createMemorialNode(memorial, position) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    group.setAttribute('class', 'memorial-node')
    group.setAttribute('data-memorial-id', memorial.id)
    group.setAttribute('transform', `translate(${position.x}, ${position.y})`)

    // Determine gender for styling
    const gender = this.determineGender(memorial.relationship)
    
    // Background rectangle
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.setAttribute('width', position.width)
    rect.setAttribute('height', position.height)
    rect.setAttribute('rx', '8')
    rect.setAttribute('ry', '8')
    rect.setAttribute('class', `memorial-bg ${gender}`)
    rect.setAttribute('fill', gender === 'male' ? '#3498db' : '#e91e63')
    rect.setAttribute('stroke', '#fff')
    rect.setAttribute('stroke-width', '2')

    // Photo (if available)
    if (memorial.photo) {
      const image = document.createElementNS('http://www.w3.org/2000/svg', 'image')
      image.setAttribute('x', '10')
      image.setAttribute('y', '10')
      image.setAttribute('width', '40')
      image.setAttribute('height', '40')
      image.setAttribute('href', memorial.photo)
      image.setAttribute('clip-path', 'circle(20px at 30px 30px)')
      group.appendChild(image)
    }

    // Name text
    const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    nameText.setAttribute('x', memorial.photo ? '60' : position.width / 2)
    nameText.setAttribute('y', '25')
    nameText.setAttribute('text-anchor', memorial.photo ? 'start' : 'middle')
    nameText.setAttribute('class', 'memorial-name')
    nameText.setAttribute('fill', '#fff')
    nameText.setAttribute('font-size', '12')
    nameText.setAttribute('font-weight', 'bold')
    nameText.textContent = this.truncateText(memorial.name, 12)

    // Relationship text
    const relationshipText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    relationshipText.setAttribute('x', memorial.photo ? '60' : position.width / 2)
    relationshipText.setAttribute('y', '40')
    relationshipText.setAttribute('text-anchor', memorial.photo ? 'start' : 'middle')
    relationshipText.setAttribute('class', 'memorial-relationship')
    relationshipText.setAttribute('fill', '#fff')
    relationshipText.setAttribute('font-size', '10')
    relationshipText.textContent = i18n.t(`relationships.${memorial.relationship}`) || memorial.relationship

    // Dates text
    if (memorial.birthDate || memorial.deathDate) {
      const datesText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      datesText.setAttribute('x', position.width / 2)
      datesText.setAttribute('y', '65')
      datesText.setAttribute('text-anchor', 'middle')
      datesText.setAttribute('class', 'memorial-dates')
      datesText.setAttribute('fill', '#fff')
      datesText.setAttribute('font-size', '8')
      
      const birthYear = memorial.birthDate ? new Date(memorial.birthDate).getFullYear() : '?'
      const deathYear = memorial.deathDate ? new Date(memorial.deathDate).getFullYear() : '?'
      datesText.textContent = `${birthYear} - ${deathYear}`
      
      group.appendChild(datesText)
    }

    group.appendChild(rect)
    group.appendChild(nameText)
    group.appendChild(relationshipText)

    // Add click handler
    group.style.cursor = 'pointer'
    group.addEventListener('click', () => {
      this.selectMemorial(memorial)
    })

    return group
  }

  /**
   * Determine gender from relationship
   */
  determineGender(relationship) {
    const maleRelationships = ['padre', 'abuelo', 'hermano', 'tio', 'primo', 'esposo', 'hijo', 'nieto', 'amigo']
    const femaleRelationships = ['madre', 'abuela', 'hermana', 'tia', 'prima', 'esposa', 'hija', 'nieta', 'amiga']
    
    if (maleRelationships.includes(relationship)) return 'male'
    if (femaleRelationships.includes(relationship)) return 'female'
    return 'neutral'
  }

  /**
   * Truncate text to fit in node
   */
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
  }

  /**
   * Select a memorial and show details
   */
  selectMemorial(memorial) {
    this.selectedMemorial = memorial
    
    // Highlight selected node
    const nodes = this.svgElement.querySelectorAll('.memorial-node')
    nodes.forEach(node => {
      node.classList.remove('selected')
      if (node.dataset.memorialId === memorial.id) {
        node.classList.add('selected')
      }
    })

    // Show memorial details
    this.showMemorialDetails(memorial)
    
    // Dispatch event for AR integration
    document.dispatchEvent(new CustomEvent('family-tree-memorial-selected', {
      detail: { memorial }
    }))
  }

  /**
   * Show memorial details panel
   */
  showMemorialDetails(memorial) {
    const detailsPanel = document.getElementById('memorial-details')
    if (!detailsPanel) return

    const relationshipData = this.relationships.get(memorial.id)
    const generation = this.generations.get(memorial.id)

    detailsPanel.innerHTML = `
      <div class="memorial-details-content">
        <div class="memorial-header">
          ${memorial.photo ? `<img src="${memorial.photo}" alt="${memorial.name}" class="memorial-photo">` : ''}
          <div class="memorial-info">
            <h3>${memorial.name}</h3>
            <p class="relationship">${i18n.t(`relationships.${memorial.relationship}`) || memorial.relationship}</p>
            <p class="generation">Generación: ${generation + 1}</p>
          </div>
        </div>
        
        <div class="memorial-story">
          ${memorial.story ? `<p>${memorial.story}</p>` : '<p>No hay historia disponible</p>'}
        </div>
        
        <div class="family-connections">
          <h4>Conexiones Familiares:</h4>
          ${relationshipData.parents.length > 0 ? `
            <div class="connection-group">
              <strong>Padres:</strong>
              <ul>
                ${relationshipData.parents.map(parentId => {
                  const parent = this.memorials.find(m => m.id === parentId)
                  return parent ? `<li><button class="family-link" data-memorial-id="${parentId}">${parent.name}</button></li>` : ''
                }).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${relationshipData.children.length > 0 ? `
            <div class="connection-group">
              <strong>Hijos:</strong>
              <ul>
                ${relationshipData.children.map(childId => {
                  const child = this.memorials.find(m => m.id === childId)
                  return child ? `<li><button class="family-link" data-memorial-id="${childId}">${child.name}</button></li>` : ''
                }).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${relationshipData.spouse ? `
            <div class="connection-group">
              <strong>Cónyuge:</strong>
              <ul>
                <li><button class="family-link" data-memorial-id="${relationshipData.spouse}">${this.memorials.find(m => m.id === relationshipData.spouse)?.name || 'Desconocido'}</button></li>
              </ul>
            </div>
          ` : ''}
        </div>
        
        <div class="family-relationships-ar">
          <h4>Visualización AR:</h4>
          <div class="ar-relationship-controls">
            <button class="show-family-connections-btn" data-memorial-id="${memorial.id}">
              🔗 Mostrar Conexiones Familiares
            </button>
            <button class="highlight-generation-btn" data-generation="${generation}">
              👥 Resaltar Generación ${generation + 1}
            </button>
            <button class="show-family-path-btn" data-memorial-id="${memorial.id}">
              🛤️ Mostrar Camino Familiar
            </button>
          </div>
        </div>
        
        <div class="memorial-actions">
          <button class="view-in-ar-btn" data-memorial-id="${memorial.id}">
            Ver en Altar AR
          </button>
          <button class="close-details-btn">
            Cerrar
          </button>
        </div>
      </div>
    `

    // Setup event listeners for details panel
    detailsPanel.querySelectorAll('.family-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const memorialId = e.target.dataset.memorialId
        const linkedMemorial = this.memorials.find(m => m.id === memorialId)
        if (linkedMemorial) {
          this.selectMemorial(linkedMemorial)
        }
      })
    })

    // AR relationship visualization controls
    detailsPanel.querySelector('.show-family-connections-btn')?.addEventListener('click', (e) => {
      const memorialId = e.target.dataset.memorialId
      this.showFamilyConnectionsInAR(memorialId)
    })

    detailsPanel.querySelector('.highlight-generation-btn')?.addEventListener('click', (e) => {
      const generation = parseInt(e.target.dataset.generation)
      this.highlightGenerationInAR(generation)
    })

    detailsPanel.querySelector('.show-family-path-btn')?.addEventListener('click', (e) => {
      const memorialId = e.target.dataset.memorialId
      this.showFamilyPathInAR(memorialId)
    })

    detailsPanel.querySelector('.view-in-ar-btn')?.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('view-memorial-in-ar', {
        detail: { memorial }
      }))
    })

    detailsPanel.querySelector('.close-details-btn')?.addEventListener('click', () => {
      detailsPanel.style.display = 'none'
      this.selectedMemorial = null
      
      // Remove selection highlight
      const nodes = this.svgElement.querySelectorAll('.memorial-node')
      nodes.forEach(node => node.classList.remove('selected'))
    })

    detailsPanel.style.display = 'block'
  }

  /**
   * Show family connections in AR
   */
  showFamilyConnectionsInAR(memorialId) {
    const memorial = this.memorials.find(m => m.id === memorialId)
    const relationshipData = this.relationships.get(memorialId)
    
    if (!memorial || !relationshipData) return

    // Collect all connected family members
    const connectedMemorials = new Set()
    
    // Add parents
    relationshipData.parents.forEach(parentId => {
      const parent = this.memorials.find(m => m.id === parentId)
      if (parent) connectedMemorials.add(parent)
    })
    
    // Add children
    relationshipData.children.forEach(childId => {
      const child = this.memorials.find(m => m.id === childId)
      if (child) connectedMemorials.add(child)
    })
    
    // Add spouse
    if (relationshipData.spouse) {
      const spouse = this.memorials.find(m => m.id === relationshipData.spouse)
      if (spouse) connectedMemorials.add(spouse)
    }

    // Dispatch event for AR visualization
    document.dispatchEvent(new CustomEvent('show-family-connections-ar', {
      detail: {
        centerMemorial: memorial,
        connectedMemorials: Array.from(connectedMemorials),
        relationships: relationshipData
      }
    }))

    console.log(`🔗 Showing family connections for ${memorial.name} in AR`)
  }

  /**
   * Highlight generation in AR
   */
  highlightGenerationInAR(generation) {
    const generationMemorials = []
    
    this.generations.forEach((gen, memorialId) => {
      if (gen === generation) {
        const memorial = this.memorials.find(m => m.id === memorialId)
        if (memorial) {
          generationMemorials.push(memorial)
        }
      }
    })

    // Dispatch event for AR visualization
    document.dispatchEvent(new CustomEvent('highlight-generation-ar', {
      detail: {
        generation: generation,
        memorials: generationMemorials
      }
    }))

    console.log(`👥 Highlighting generation ${generation + 1} in AR`)
  }

  /**
   * Show family path in AR (genealogical line)
   */
  showFamilyPathInAR(memorialId) {
    const memorial = this.memorials.find(m => m.id === memorialId)
    if (!memorial) return

    // Build genealogical path from oldest ancestor to this memorial
    const path = this.buildFamilyPath(memorialId)

    // Dispatch event for AR visualization
    document.dispatchEvent(new CustomEvent('show-family-path-ar', {
      detail: {
        targetMemorial: memorial,
        genealogicalPath: path
      }
    }))

    console.log(`🛤️ Showing family path for ${memorial.name} in AR`)
  }

  /**
   * Build genealogical path from root to target memorial
   */
  buildFamilyPath(targetMemorialId) {
    const path = []
    const visited = new Set()
    
    // Find path using DFS from roots
    const findPath = (currentId, currentPath) => {
      if (visited.has(currentId)) return false
      visited.add(currentId)
      
      const memorial = this.memorials.find(m => m.id === currentId)
      if (!memorial) return false
      
      const newPath = [...currentPath, memorial]
      
      if (currentId === targetMemorialId) {
        path.push(...newPath)
        return true
      }
      
      const relationshipData = this.relationships.get(currentId)
      if (relationshipData) {
        // Check children
        for (const childId of relationshipData.children) {
          if (findPath(childId, newPath)) {
            return true
          }
        }
      }
      
      return false
    }
    
    // Start from root nodes (people with no parents)
    this.relationships.forEach((data, id) => {
      if (data.parents.length === 0 && path.length === 0) {
        findPath(id, [])
      }
    })
    
    return path
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Tree controls
    const zoomInBtn = this.container.querySelector('.zoom-in-btn')
    const zoomOutBtn = this.container.querySelector('.zoom-out-btn')
    const centerBtn = this.container.querySelector('.center-tree-btn')
    const toggleViewBtn = this.container.querySelector('.toggle-view-btn')

    zoomInBtn?.addEventListener('click', () => this.zoomIn())
    zoomOutBtn?.addEventListener('click', () => this.zoomOut())
    centerBtn?.addEventListener('click', () => this.centerTree())
    toggleViewBtn?.addEventListener('click', () => this.toggleView())

    // Listen for memorial updates
    appState.subscribe('memorials', (memorials) => {
      this.memorials = memorials
      this.buildRelationshipMap()
      this.calculateGenerations()
      this.renderTreeVisualization()
    })
  }

  /**
   * Zoom in on the tree
   */
  zoomIn() {
    const currentViewBox = this.svgElement.getAttribute('viewBox').split(' ')
    const scale = 0.8
    const newWidth = parseFloat(currentViewBox[2]) * scale
    const newHeight = parseFloat(currentViewBox[3]) * scale
    const newX = parseFloat(currentViewBox[0]) + (parseFloat(currentViewBox[2]) - newWidth) / 2
    const newY = parseFloat(currentViewBox[1]) + (parseFloat(currentViewBox[3]) - newHeight) / 2
    
    this.svgElement.setAttribute('viewBox', `${newX} ${newY} ${newWidth} ${newHeight}`)
  }

  /**
   * Zoom out on the tree
   */
  zoomOut() {
    const currentViewBox = this.svgElement.getAttribute('viewBox').split(' ')
    const scale = 1.25
    const newWidth = parseFloat(currentViewBox[2]) * scale
    const newHeight = parseFloat(currentViewBox[3]) * scale
    const newX = parseFloat(currentViewBox[0]) - (newWidth - parseFloat(currentViewBox[2])) / 2
    const newY = parseFloat(currentViewBox[1]) - (newHeight - parseFloat(currentViewBox[3])) / 2
    
    this.svgElement.setAttribute('viewBox', `${newX} ${newY} ${newWidth} ${newHeight}`)
  }

  /**
   * Center the tree view
   */
  centerTree() {
    const layout = this.calculateTreeLayout()
    this.svgElement.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`)
  }

  /**
   * Toggle between different tree views
   */
  toggleView() {
    // This could switch between different layout algorithms
    // For now, just recalculate and re-render
    this.calculateGenerations()
    this.renderTreeVisualization()
  }

  /**
   * Update memorial data
   */
  updateMemorials(memorials) {
    this.memorials = memorials
    this.buildRelationshipMap()
    this.calculateGenerations()
    this.renderTreeVisualization()
  }

  /**
   * Dispose component
   */
  dispose() {
    this.isInitialized = false
    console.log('🧹 Family Tree Component disposed')
  }
}
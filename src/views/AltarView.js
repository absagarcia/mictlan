/**
 * Altar View
 * Main view for the AR altar experience
 */

import { arService } from '../services/ARService.js'
import { appState } from '../state/AppState.js'

export class AltarView {
  constructor(container) {
    this.container = container
    this.arComponents = null
    this.isInitialized = false
  }

  /**
   * Render the altar view
   */
  async render() {
    if (this.isInitialized) return

    console.log('🏛️ Rendering Altar View...')

    try {
      // Create main container
      this.container.innerHTML = `
        <div class="altar-view">
          <div class="altar-container" id="altar-container">
            <div class="loading-message">
              <div class="spinner"></div>
              <p>Cargando altar...</p>
            </div>
          </div>
          
          <div class="altar-controls">
            <button id="ar-toggle" class="ar-button" disabled>
              <span class="ar-icon">🥽</span>
              <span class="ar-text">Iniciar AR</span>
            </button>
            
            <button id="offerings-button" class="offerings-button">
              <span class="offerings-icon">🎁</span>
              <span class="offerings-text">Ofrendas</span>
            </button>
            
            <button id="reset-view" class="reset-button">
              <span class="reset-icon">🔄</span>
              <span class="reset-text">Reiniciar Vista</span>
            </button>
          </div>
          
          <div class="altar-info" id="altar-info">
            <div class="performance-info" id="performance-info"></div>
            <div class="level-info" id="level-info" style="display: none;"></div>
          </div>
        </div>
      `

      // Get memorial data from app state
      const memorials = appState.get('memorials') || []
      
      // Initialize AR altar experience
      const altarContainer = document.getElementById('altar-container')
      this.arComponents = await arService.createAltarExperience(altarContainer, memorials)
      
      // Setup event listeners
      this.setupEventListeners()
      
      // Hide loading message
      const loadingMessage = altarContainer.querySelector('.loading-message')
      if (loadingMessage) {
        loadingMessage.style.display = 'none'
      }
      
      // Enable AR button if supported
      const arStatus = arService.getARStatus()
      const arButton = document.getElementById('ar-toggle')
      if (arStatus.isSupported) {
        arButton.disabled = false
        arButton.title = 'Iniciar experiencia de realidad aumentada'
      } else {
        arButton.title = arStatus.capabilities ? 
          'AR no soportado en este dispositivo' : 
          'Cargando capacidades AR...'
      }
      
      // Update performance info
      this.updatePerformanceInfo()
      
      this.isInitialized = true
      console.log('✅ Altar View rendered')
      
    } catch (error) {
      console.error('❌ Failed to render Altar View:', error)
      this.showError(error)
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // AR toggle button
    const arButton = document.getElementById('ar-toggle')
    arButton.addEventListener('click', this.toggleAR.bind(this))
    
    // Offerings button
    const offeringsButton = document.getElementById('offerings-button')
    offeringsButton.addEventListener('click', this.showOfferingCatalog.bind(this))
    
    // Reset view button
    const resetButton = document.getElementById('reset-view')
    resetButton.addEventListener('click', this.resetView.bind(this))
    
    // Educational content events
    document.addEventListener('show-educational-content', this.onShowEducationalContent.bind(this))
    
    // Memorial detail events
    document.addEventListener('show-memorial-details', this.onShowMemorialDetails.bind(this))
    
    // Offering catalog events
    document.addEventListener('display-offering-catalog', this.onDisplayOfferingCatalog.bind(this))
    
    // Performance updates
    setInterval(() => {
      this.updatePerformanceInfo()
    }, 2000)
  }

  /**
   * Toggle AR mode
   */
  async toggleAR() {
    const arButton = document.getElementById('ar-toggle')
    const arText = arButton.querySelector('.ar-text')
    
    try {
      if (arService.getARStatus().isARActive) {
        // End AR session
        await arService.endARSession()
        arText.textContent = 'Iniciar AR'
        arButton.classList.remove('active')
      } else {
        // Start AR session
        arText.textContent = 'Iniciando...'
        arButton.disabled = true
        
        const success = await arService.startARSession()
        
        if (success) {
          arText.textContent = 'Salir AR'
          arButton.classList.add('active')
        } else {
          arText.textContent = 'Iniciar AR'
        }
        
        arButton.disabled = false
      }
    } catch (error) {
      console.error('Error toggling AR:', error)
      arText.textContent = 'Error AR'
      arButton.disabled = false
    }
  }

  /**
   * Show offering catalog
   */
  showOfferingCatalog() {
    const catalog = arService.getOfferingCatalog()
    
    // Create catalog modal
    const modal = document.createElement('div')
    modal.className = 'offering-catalog-modal'
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Catálogo de Ofrendas</h2>
          <button class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <div class="offering-grid">
            ${catalog.map(offering => `
              <div class="offering-item" data-type="${offering.type}">
                <div class="offering-icon" style="color: #${offering.color.toString(16)}">
                  ${this.getOfferingIcon(offering.type)}
                </div>
                <h3>${offering.name}</h3>
                <p>${offering.description}</p>
                <div class="offering-meaning">
                  <small>${offering.meaning}</small>
                </div>
                <button class="place-offering-btn" data-type="${offering.type}">
                  Colocar Ofrenda
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `
    
    // Add event listeners
    modal.querySelector('.close-button').addEventListener('click', () => {
      document.body.removeChild(modal)
    })
    
    modal.querySelectorAll('.place-offering-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const offeringType = e.target.dataset.type
        arService.offeringsComponent.startPlacementMode(offeringType)
        document.body.removeChild(modal)
      })
    })
    
    document.body.appendChild(modal)
  }

  /**
   * Get icon for offering type
   */
  getOfferingIcon(type) {
    const icons = {
      cempasuchil: '🌼',
      pan_de_muerto: '🍞',
      agua: '💧',
      sal: '🧂',
      vela: '🕯️',
      incienso: '🔥',
      foto: '📷',
      comida_favorita: '🍽️'
    }
    return icons[type] || '🎁'
  }

  /**
   * Reset camera view
   */
  resetView() {
    arService.resetCameraView()
  }

  /**
   * Update performance information
   */
  updatePerformanceInfo() {
    const metrics = arService.getPerformanceMetrics()
    if (!metrics) return
    
    const performanceInfo = document.getElementById('performance-info')
    if (performanceInfo) {
      performanceInfo.innerHTML = `
        <div class="performance-metrics">
          <span class="fps">FPS: ${Math.round(metrics.fps)}</span>
          <span class="quality">Calidad: ${metrics.qualityLevel}</span>
          ${metrics.memoryUsage ? `<span class="memory">Memoria: ${Math.round(metrics.memoryUsage)}MB</span>` : ''}
        </div>
      `
    }
  }

  /**
   * Handle educational content display
   */
  onShowEducationalContent(event) {
    const { level, content } = event.detail
    const levelInfo = document.getElementById('level-info')
    
    levelInfo.innerHTML = `
      <div class="level-content">
        <h3>${content.name}</h3>
        <p>${content.description}</p>
        <div class="level-meaning">
          <h4>Significado:</h4>
          <p>${content.meaning}</p>
        </div>
        <div class="level-offerings">
          <h4>Ofrendas tradicionales:</h4>
          <ul>
            ${content.offerings.map(offering => `<li>${offering}</li>`).join('')}
          </ul>
        </div>
        <div class="coco-reference">
          <h4>Conexión con Coco:</h4>
          <p>${content.cocoReference}</p>
        </div>
        <button class="close-level-info">Cerrar</button>
      </div>
    `
    
    levelInfo.style.display = 'block'
    
    // Add close button listener
    levelInfo.querySelector('.close-level-info').addEventListener('click', () => {
      levelInfo.style.display = 'none'
    })
  }

  /**
   * Handle memorial details display
   */
  onShowMemorialDetails(event) {
    const { memorial, offerings } = event.detail
    
    // Create memorial details modal
    const modal = document.createElement('div')
    modal.className = 'memorial-details-modal'
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${memorial.name}</h2>
          <button class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <div class="memorial-info">
            ${memorial.photo ? `<img src="${memorial.photo}" alt="${memorial.name}" class="memorial-photo">` : ''}
            <div class="memorial-details">
              <p><strong>Relación:</strong> ${memorial.relationship || 'Familiar'}</p>
              ${memorial.birthDate ? `<p><strong>Nacimiento:</strong> ${new Date(memorial.birthDate).toLocaleDateString()}</p>` : ''}
              ${memorial.deathDate ? `<p><strong>Fallecimiento:</strong> ${new Date(memorial.deathDate).toLocaleDateString()}</p>` : ''}
              ${memorial.story ? `<div class="memorial-story"><h4>Historia:</h4><p>${memorial.story}</p></div>` : ''}
            </div>
          </div>
          
          <div class="memorial-offerings">
            <h3>Ofrendas colocadas (${offerings.length})</h3>
            <div class="offerings-list">
              ${offerings.map(offering => `
                <div class="offering-item">
                  <span class="offering-icon">${this.getOfferingIcon(offering.type)}</span>
                  <span class="offering-name">${offering.type.replace('_', ' ')}</span>
                  <span class="offering-level">Nivel: ${offering.level}</span>
                </div>
              `).join('')}
            </div>
            
            <button class="add-offering-btn" data-memorial-id="${memorial.id}">
              Agregar Ofrenda
            </button>
          </div>
        </div>
      </div>
    `
    
    // Add event listeners
    modal.querySelector('.close-button').addEventListener('click', () => {
      document.body.removeChild(modal)
    })
    
    modal.querySelector('.add-offering-btn').addEventListener('click', () => {
      document.body.removeChild(modal)
      this.showOfferingCatalog()
    })
    
    document.body.appendChild(modal)
  }

  /**
   * Handle offering catalog display
   */
  onDisplayOfferingCatalog(event) {
    // This is handled by showOfferingCatalog method
  }

  /**
   * Show error message
   */
  showError(error) {
    this.container.innerHTML = `
      <div class="altar-error">
        <h2>Error al cargar el altar</h2>
        <p>Ocurrió un error al inicializar la experiencia AR:</p>
        <pre>${error.message}</pre>
        <button onclick="window.location.reload()">Reintentar</button>
      </div>
    `
  }

  /**
   * Cleanup view
   */
  dispose() {
    if (this.arComponents) {
      arService.dispose()
    }
    
    this.isInitialized = false
    console.log('🧹 Altar View disposed')
  }
}
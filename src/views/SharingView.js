/**
 * Sharing View
 * Main view for export and sharing capabilities
 */

import { appState } from '../state/AppState.js'
import { i18n } from '../i18n/i18n.js'
import { SharingComponent } from '../components/sharing/SharingComponent.js'
import { accessibilityManager } from '../utils/accessibility.js'

export class SharingView {
  constructor(container) {
    this.container = container
    this.sharingComponent = null
    this.isInitialized = false
  }

  /**
   * Render the sharing view
   */
  async render() {
    if (!this.container) {
      throw new Error('Container is required for SharingView')
    }

    try {
      console.log('📤 Rendering Sharing View...')

      // Set page title and meta
      document.title = `${i18n.t('sharing.title')} - Mictla`
      
      // Create main content structure
      this.container.innerHTML = `
        <div class="sharing-view">
          <header class="view-header">
            <div class="container">
              <nav class="breadcrumb" aria-label="Navegación">
                <ol>
                  <li><a href="/" aria-label="Ir al inicio">🏠 Inicio</a></li>
                  <li aria-current="page">📤 Compartir y Exportar</li>
                </ol>
              </nav>
              
              <div class="header-content">
                <h1 id="main-heading">
                  📤 Compartir y Exportar
                </h1>
                <p class="header-description">
                  Comparte tus memorias familiares con seres queridos o exporta tu colección completa
                </p>
              </div>
            </div>
          </header>

          <main id="main-content" class="view-main" role="main" aria-labelledby="main-heading">
            <div class="container">
              <div id="sharing-container" class="sharing-container">
                <!-- Sharing component will be rendered here -->
              </div>
            </div>
          </main>
        </div>
      `

      // Initialize sharing component
      await this.initializeSharingComponent()

      // Setup accessibility
      this.setupAccessibility()

      // Setup event listeners
      this.setupEventListeners()

      this.isInitialized = true
      console.log('✅ Sharing View rendered successfully')

    } catch (error) {
      console.error('❌ Failed to render Sharing View:', error)
      this.renderErrorState(error)
    }
  }

  /**
   * Initialize sharing component
   */
  async initializeSharingComponent() {
    const sharingContainer = this.container.querySelector('#sharing-container')
    
    if (!sharingContainer) {
      throw new Error('Sharing container not found')
    }

    // Create and initialize sharing component
    this.sharingComponent = new SharingComponent(sharingContainer)
    await this.sharingComponent.init()
  }

  /**
   * Setup accessibility features
   */
  setupAccessibility() {
    // Set focus to main heading
    const mainHeading = this.container.querySelector('#main-heading')
    if (mainHeading) {
      accessibilityManager.setFocus(mainHeading)
    }

    // Announce page change to screen readers
    accessibilityManager.announceToScreenReader(
      'Página de compartir y exportar cargada. Aquí puedes exportar tus memorias a PDF o crear enlaces para compartir con familia.'
    )

    // Setup keyboard navigation
    this.setupKeyboardNavigation()
  }

  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    // Handle escape key to go back
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        // Close any open modals first
        if (this.sharingComponent?.currentModal) {
          this.sharingComponent.currentModal.hide()
          return
        }
        
        // Navigate back to memories view
        window.history.back()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // Store reference for cleanup
    this.keydownHandler = handleKeyDown
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for memorial changes to update sharing options
    this.memorialSubscription = appState.subscribe('memorials', () => {
      if (this.sharingComponent) {
        this.sharingComponent.render()
        this.sharingComponent.setupEventListeners()
      }
    })

    // Listen for language changes
    this.languageSubscription = appState.subscribe('user.language', () => {
      this.render() // Re-render with new language
    })

    // Handle browser back/forward
    window.addEventListener('popstate', this.handlePopState.bind(this))
  }

  /**
   * Handle browser navigation
   */
  handlePopState(event) {
    // Close any open modals when navigating
    if (this.sharingComponent?.currentModal) {
      this.sharingComponent.currentModal.hide()
    }
  }

  /**
   * Render error state
   */
  renderErrorState(error) {
    this.container.innerHTML = `
      <div class="error-state">
        <div class="container">
          <div class="error-content">
            <div class="error-icon">😔</div>
            <h1>Error al cargar la página de compartir</h1>
            <p>No se pudo cargar la funcionalidad de compartir y exportar.</p>
            
            <details class="error-details">
              <summary>Detalles técnicos</summary>
              <pre>${error.message}</pre>
            </details>
            
            <div class="error-actions">
              <button class="btn btn-primary" onclick="window.location.reload()">
                🔄 Reintentar
              </button>
              <a href="/memories" class="btn btn-outline">
                📚 Ir a Memorias
              </a>
              <a href="/" class="btn btn-outline">
                🏠 Ir al Inicio
              </a>
            </div>
          </div>
        </div>
      </div>
    `
  }

  /**
   * Get sharing statistics for analytics
   */
  getAnalytics() {
    const memorials = appState.get('memorials') || []
    
    return {
      view: 'sharing',
      memorialsAvailable: memorials.length,
      memorialsWithPhotos: memorials.filter(m => m.photo).length,
      memorialsWithStories: memorials.filter(m => m.story).length,
      memorialsWithAudio: memorials.filter(m => m.audioMessage).length,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Dispose view and cleanup resources
   */
  dispose() {
    console.log('🧹 Disposing Sharing View...')

    // Dispose sharing component
    if (this.sharingComponent) {
      this.sharingComponent.dispose()
      this.sharingComponent = null
    }

    // Remove event listeners
    if (this.keydownHandler) {
      document.removeEventListener('keydown', this.keydownHandler)
      this.keydownHandler = null
    }

    if (this.memorialSubscription) {
      this.memorialSubscription()
      this.memorialSubscription = null
    }

    if (this.languageSubscription) {
      this.languageSubscription()
      this.languageSubscription = null
    }

    window.removeEventListener('popstate', this.handlePopState.bind(this))

    this.isInitialized = false
    console.log('✅ Sharing View disposed')
  }
}
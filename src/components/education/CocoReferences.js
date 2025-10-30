/**
 * Coco References Component
 * Displays connections between Coco movie themes and Day of the Dead traditions
 * Provides contextual information about family, memory, and cultural values
 */

import { i18n } from '../../i18n/i18n.js'
import { appState } from '../../state/AppState.js'
import { accessibilityManager } from '../../utils/accessibility.js'

export class CocoReferences {
  constructor(container) {
    this.container = container
    this.isInitialized = false
    this.currentTheme = null
  }

  /**
   * Initialize the Coco references component
   */
  async init() {
    if (this.isInitialized) return

    console.log('🎬 Initializing Coco References Component...')

    try {
      // Load cultural data
      const { culturalData } = await import('../../utils/culturalData.js')
      this.culturalData = culturalData
      
      // Setup event listeners
      this.setupEventListeners()
      
      this.isInitialized = true
      console.log('✅ Coco References Component initialized')
      
    } catch (error) {
      console.error('❌ Failed to initialize Coco References Component:', error)
      throw error
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for language changes
    appState.subscribe('user.language', this.onLanguageChange.bind(this))
    
    // Listen for theme requests
    document.addEventListener('show-coco-theme', this.onShowTheme.bind(this))
  }

  /**
   * Handle language change
   */
  onLanguageChange(language) {
    if (this.currentTheme) {
      this.displayTheme(this.currentTheme)
    }
  }

  /**
   * Handle show theme request
   */
  onShowTheme(event) {
    const { theme } = event.detail
    this.displayTheme(theme)
  }

  /**
   * Display a specific Coco theme
   */
  displayTheme(themeKey) {
    this.currentTheme = themeKey
    const themeData = this.culturalData.cocoThemes[themeKey]
    
    if (!themeData) {
      console.warn(`No Coco theme data found for ${themeKey}`)
      return
    }

    const currentLang = appState.get('user.language') || 'es'
    const theme = themeData[currentLang] || themeData.es

    // Clear container and render theme
    this.container.innerHTML = this.renderThemeContent(theme, themeKey)
    
    // Setup interactions
    this.setupThemeInteractions()
    
    // Announce to screen readers
    accessibilityManager.announce(`Mostrando tema de Coco: ${theme.title}`)
  }

  /**
   * Render theme content
   */
  renderThemeContent(theme, themeKey) {
    return `
      <div class="coco-theme-container" data-theme="${themeKey}">
        <header class="theme-header">
          <h2 class="theme-title">${theme.title}</h2>
          <div class="theme-icon" aria-hidden="true">🎬</div>
        </header>
        
        <section class="theme-description">
          <p class="description-text">${theme.description}</p>
        </section>
        
        <section class="theme-connection">
          <h3>Conexión Cultural</h3>
          <p class="connection-text">${theme.connection}</p>
        </section>
        
        ${theme.keyLessons ? `
          <section class="key-lessons">
            <h3>Lecciones Clave</h3>
            <ul class="lessons-list" role="list">
              ${theme.keyLessons.map((lesson, index) => `
                <li class="lesson-item" role="listitem" tabindex="0">
                  <span class="lesson-icon" aria-hidden="true">💡</span>
                  <span class="lesson-text">${lesson}</span>
                </li>
              `).join('')}
            </ul>
          </section>
        ` : ''}
        
        ${theme.practicalApplication ? `
          <section class="practical-application">
            <h3>En Mictla</h3>
            <div class="application-content">
              <span class="app-icon" aria-hidden="true">📱</span>
              <p class="application-text">${theme.practicalApplication}</p>
            </div>
          </section>
        ` : ''}
        
        ${theme.cocoMoments ? `
          <section class="coco-moments">
            <h3>Momentos en la Película</h3>
            <div class="moments-list">
              ${theme.cocoMoments.map((moment, index) => `
                <div class="moment-item" tabindex="0">
                  <span class="moment-icon" aria-hidden="true">🎭</span>
                  <p class="moment-text">${moment}</p>
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}
        
        ${theme.symbolism ? `
          <section class="symbolism-section">
            <h3>Simbolismo</h3>
            <div class="symbolism-grid">
              ${Object.entries(theme.symbolism).map(([key, value]) => `
                <div class="symbolism-item" tabindex="0">
                  <h4 class="symbol-title">${this.formatSymbolTitle(key)}</h4>
                  <p class="symbol-description">${value}</p>
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}
        
        ${theme.rememberingActions ? `
          <section class="remembering-actions">
            <h3>Cómo Recordar</h3>
            <div class="actions-grid">
              ${theme.rememberingActions.map((action, index) => `
                <div class="action-item" tabindex="0">
                  <span class="action-icon" aria-hidden="true">❤️</span>
                  <p class="action-text">${action}</p>
                </div>
              `).join('')}
            </div>
          </section>
        ` : ''}
        
        <footer class="theme-footer">
          <div class="coco-quote-container">
            <blockquote class="featured-quote">
              <p>"${this.getRelevantQuote(themeKey)}"</p>
              <cite>- Coco (Disney/Pixar)</cite>
            </blockquote>
          </div>
        </footer>
      </div>
    `
  }

  /**
   * Format symbol title for display
   */
  formatSymbolTitle(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }

  /**
   * Get relevant quote for theme
   */
  getRelevantQuote(themeKey) {
    const quotes = {
      familyMemory: i18n.t('coco.quote2'), // "Recuérdame..."
      musicAndTradition: i18n.t('coco.quote3'), // "La música es la única forma..."
      familyFirst: i18n.t('coco.quote1'), // "La familia es lo más importante"
      bridgeBetweenWorlds: i18n.t('coco.quote2'), // "Recuérdame..."
      forgettingVsRemembering: i18n.t('coco.quote4') // "Nuestras tradiciones..."
    }
    
    return quotes[themeKey] || i18n.t('coco.quote1')
  }

  /**
   * Setup theme interactions
   */
  setupThemeInteractions() {
    // Add keyboard navigation for interactive elements
    const interactiveElements = this.container.querySelectorAll('[tabindex="0"]')
    
    interactiveElements.forEach((element, index) => {
      element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          this.handleElementActivation(element)
        }
        
        // Arrow key navigation
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault()
          const nextElement = interactiveElements[index + 1]
          if (nextElement) nextElement.focus()
        }
        
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault()
          const prevElement = interactiveElements[index - 1]
          if (prevElement) prevElement.focus()
        }
      })
      
      // Add focus indicators
      element.addEventListener('focus', () => {
        element.classList.add('focused')
      })
      
      element.addEventListener('blur', () => {
        element.classList.remove('focused')
      })
    })
  }

  /**
   * Handle element activation
   */
  handleElementActivation(element) {
    // Read content aloud for accessibility
    const text = element.textContent || element.innerText
    accessibilityManager.announce(text)
    
    // Add visual feedback
    element.classList.add('activated')
    setTimeout(() => {
      element.classList.remove('activated')
    }, 300)
  }

  /**
   * Display all themes overview
   */
  displayAllThemes() {
    const currentLang = appState.get('user.language') || 'es'
    const themes = this.culturalData.cocoThemes
    
    this.container.innerHTML = `
      <div class="all-themes-container">
        <header class="themes-header">
          <h2>${i18n.t('education.coco_themes')}</h2>
          <p class="themes-subtitle">
            ${currentLang === 'es' 
              ? 'Descubre cómo los temas de Coco se conectan con las tradiciones del Día de Muertos'
              : 'Discover how Coco\'s themes connect with Day of the Dead traditions'
            }
          </p>
        </header>
        
        <div class="themes-grid">
          ${Object.entries(themes).map(([themeKey, themeData]) => {
            const theme = themeData[currentLang] || themeData.es
            return `
              <div class="theme-card" 
                   data-theme="${themeKey}" 
                   tabindex="0"
                   role="button"
                   aria-label="Ver tema: ${theme.title}">
                <div class="card-header">
                  <h3 class="card-title">${theme.title}</h3>
                  <div class="card-icon" aria-hidden="true">🎬</div>
                </div>
                <div class="card-content">
                  <p class="card-description">${theme.description.substring(0, 120)}...</p>
                </div>
                <div class="card-footer">
                  <span class="view-theme-text">
                    ${currentLang === 'es' ? 'Ver tema completo' : 'View full theme'}
                  </span>
                </div>
              </div>
            `
          }).join('')}
        </div>
      </div>
    `
    
    // Setup theme card interactions
    this.setupThemeCardInteractions()
  }

  /**
   * Setup theme card interactions
   */
  setupThemeCardInteractions() {
    const themeCards = this.container.querySelectorAll('.theme-card')
    
    themeCards.forEach(card => {
      const themeKey = card.dataset.theme
      
      // Click handler
      card.addEventListener('click', () => {
        this.displayTheme(themeKey)
      })
      
      // Keyboard handler
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          this.displayTheme(themeKey)
        }
      })
      
      // Hover effects
      card.addEventListener('mouseenter', () => {
        card.classList.add('hovered')
      })
      
      card.addEventListener('mouseleave', () => {
        card.classList.remove('hovered')
      })
    })
  }

  /**
   * Create inline reference for specific context
   */
  createInlineReference(themeKey, context = 'brief') {
    const themeData = this.culturalData.cocoThemes[themeKey]
    if (!themeData) return ''
    
    const currentLang = appState.get('user.language') || 'es'
    const theme = themeData[currentLang] || themeData.es
    
    if (context === 'brief') {
      return `
        <div class="inline-coco-reference" data-theme="${themeKey}">
          <div class="reference-header">
            <span class="coco-icon" aria-hidden="true">🎬</span>
            <span class="reference-title">${theme.title}</span>
          </div>
          <p class="reference-text">${theme.connection}</p>
          <button class="expand-reference-btn" 
                  data-theme="${themeKey}"
                  aria-label="Ver tema completo de Coco">
            ${currentLang === 'es' ? 'Ver más' : 'See more'}
          </button>
        </div>
      `
    }
    
    return this.renderThemeContent(theme, themeKey)
  }

  /**
   * Dispose component
   */
  dispose() {
    // Remove event listeners
    document.removeEventListener('show-coco-theme', this.onShowTheme.bind(this))
    
    this.isInitialized = false
    console.log('🧹 Coco References Component disposed')
  }
}
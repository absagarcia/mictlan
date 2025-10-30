/**
 * Educational View
 * Main interface for learning about Day of the Dead traditions and Coco themes
 */

import { EducationalContentComponent } from '../components/education/EducationalContentComponent.js'
import { CocoReferences } from '../components/education/CocoReferences.js'
import { i18n } from '../i18n/i18n.js'
import { appState } from '../state/AppState.js'

export class EducationalView {
  constructor(container) {
    this.container = container
    this.educationalContent = null
    this.cocoReferences = null
    this.isInitialized = false
    this.currentSection = 'overview'
  }

  /**
   * Render the educational view
   */
  async render() {
    if (this.isInitialized) return

    console.log('📚 Rendering Educational View...')

    try {
      // Create main container
      this.container.innerHTML = `
        <div class="educational-view">
          <header class="educational-header">
            <div class="container">
              <h1 class="educational-title">${i18n.t('education.title')}</h1>
              <p class="educational-subtitle">${i18n.t('education.subtitle')}</p>
            </div>
          </header>
          
          <nav class="educational-nav">
            <div class="container">
              <div class="nav-tabs" role="tablist">
                <button class="nav-tab active" 
                        data-section="overview" 
                        role="tab" 
                        aria-selected="true"
                        aria-controls="overview-panel">
                  <span class="tab-icon">🏛️</span>
                  <span class="tab-text">Visión General</span>
                </button>
                
                <button class="nav-tab" 
                        data-section="altar-levels" 
                        role="tab" 
                        aria-selected="false"
                        aria-controls="altar-levels-panel">
                  <span class="tab-icon">📚</span>
                  <span class="tab-text">${i18n.t('education.traditions')}</span>
                </button>
                
                <button class="nav-tab" 
                        data-section="offerings" 
                        role="tab" 
                        aria-selected="false"
                        aria-controls="offerings-panel">
                  <span class="tab-icon">🎁</span>
                  <span class="tab-text">${i18n.t('education.offerings_guide')}</span>
                </button>
                
                <button class="nav-tab" 
                        data-section="coco-themes" 
                        role="tab" 
                        aria-selected="false"
                        aria-controls="coco-themes-panel">
                  <span class="tab-icon">🎬</span>
                  <span class="tab-text">${i18n.t('education.coco_themes')}</span>
                </button>
                
                <button class="nav-tab" 
                        data-section="respectful-practices" 
                        role="tab" 
                        aria-selected="false"
                        aria-controls="respectful-practices-panel">
                  <span class="tab-icon">🙏</span>
                  <span class="tab-text">${i18n.t('education.respectful_practices')}</span>
                </button>
              </div>
            </div>
          </nav>
          
          <main class="educational-content">
            <div class="container">
              <div class="content-panels">
                <div id="overview-panel" 
                     class="content-panel active" 
                     role="tabpanel" 
                     aria-labelledby="overview-tab">
                  ${this.renderOverviewPanel()}
                </div>
                
                <div id="altar-levels-panel" 
                     class="content-panel" 
                     role="tabpanel" 
                     aria-labelledby="altar-levels-tab">
                  ${this.renderAltarLevelsPanel()}
                </div>
                
                <div id="offerings-panel" 
                     class="content-panel" 
                     role="tabpanel" 
                     aria-labelledby="offerings-tab">
                  ${this.renderOfferingsPanel()}
                </div>
                
                <div id="coco-themes-panel" 
                     class="content-panel" 
                     role="tabpanel" 
                     aria-labelledby="coco-themes-tab">
                  <div id="coco-themes-content"></div>
                </div>
                
                <div id="respectful-practices-panel" 
                     class="content-panel" 
                     role="tabpanel" 
                     aria-labelledby="respectful-practices-tab">
                  <div id="respectful-practices-content"></div>
                </div>
              </div>
            </div>
          </main>
        </div>
      `

      // Initialize components
      await this.initializeComponents()
      
      // Setup event listeners
      this.setupEventListeners()
      
      // Load initial content
      await this.loadCocoThemes()
      await this.loadRespectfulPractices()
      
      this.isInitialized = true
      console.log('✅ Educational View rendered')
      
    } catch (error) {
      console.error('❌ Failed to render Educational View:', error)
      this.showError(error)
    }
  }

  /**
   * Initialize educational components
   */
  async initializeComponents() {
    // Initialize educational content component
    this.educationalContent = new EducationalContentComponent(this.container)
    await this.educationalContent.init()
    
    // Initialize Coco references component
    const cocoContainer = document.getElementById('coco-themes-content')
    this.cocoReferences = new CocoReferences(cocoContainer)
    await this.cocoReferences.init()
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Tab navigation
    const navTabs = this.container.querySelectorAll('.nav-tab')
    navTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const section = e.target.closest('.nav-tab').dataset.section
        this.switchSection(section)
      })
      
      // Keyboard navigation
      tab.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          tab.click()
        }
        
        // Arrow key navigation
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault()
          const tabs = Array.from(navTabs)
          const currentIndex = tabs.indexOf(tab)
          const nextIndex = e.key === 'ArrowRight' 
            ? (currentIndex + 1) % tabs.length
            : (currentIndex - 1 + tabs.length) % tabs.length
          
          tabs[nextIndex].focus()
        }
      })
    })
    
    // Language change listener
    appState.subscribe('user.language', this.onLanguageChange.bind(this))
    
    // Educational content interaction listeners
    document.addEventListener('educational-content-shown', this.onEducationalContentShown.bind(this))
  }

  /**
   * Switch between educational sections
   */
  switchSection(section) {
    this.currentSection = section
    
    // Update tab states
    const navTabs = this.container.querySelectorAll('.nav-tab')
    const contentPanels = this.container.querySelectorAll('.content-panel')
    
    navTabs.forEach(tab => {
      const isActive = tab.dataset.section === section
      tab.classList.toggle('active', isActive)
      tab.setAttribute('aria-selected', isActive.toString())
    })
    
    contentPanels.forEach(panel => {
      const isActive = panel.id === `${section}-panel`
      panel.classList.toggle('active', isActive)
    })
    
    // Load section-specific content
    this.loadSectionContent(section)
    
    // Announce section change to screen readers
    const sectionNames = {
      overview: 'Visión General',
      'altar-levels': i18n.t('education.traditions'),
      offerings: i18n.t('education.offerings_guide'),
      'coco-themes': i18n.t('education.coco_themes'),
      'respectful-practices': i18n.t('education.respectful_practices')
    }
    
    // Use accessibility manager if available
    if (window.accessibilityManager) {
      window.accessibilityManager.announce(`Sección cambiada a: ${sectionNames[section]}`)
    }
  }

  /**
   * Load content for specific section
   */
  async loadSectionContent(section) {
    switch (section) {
      case 'coco-themes':
        await this.loadCocoThemes()
        break
      case 'respectful-practices':
        await this.loadRespectfulPractices()
        break
      case 'altar-levels':
        this.loadAltarLevelsContent()
        break
      case 'offerings':
        this.loadOfferingsContent()
        break
    }
  }

  /**
   * Load Coco themes content
   */
  async loadCocoThemes() {
    if (this.cocoReferences) {
      this.cocoReferences.displayAllThemes()
    }
  }

  /**
   * Load respectful practices content
   */
  async loadRespectfulPractices() {
    if (this.educationalContent) {
      const container = document.getElementById('respectful-practices-content')
      if (container) {
        this.educationalContent.showRespectfulPractices()
      }
    }
  }

  /**
   * Load altar levels interactive content
   */
  loadAltarLevelsContent() {
    const panel = document.getElementById('altar-levels-panel')
    if (!panel.querySelector('.levels-interactive')) {
      const interactiveContent = document.createElement('div')
      interactiveContent.className = 'levels-interactive'
      interactiveContent.innerHTML = `
        <div class="levels-grid">
          <div class="level-card" data-level="1" tabindex="0" role="button">
            <div class="level-header">
              <span class="level-icon">🌍</span>
              <h3>${i18n.t('altar.level1')}</h3>
            </div>
            <p>${i18n.t('altar.level1_description')}</p>
            <div class="level-action">
              <span class="learn-more-text">Aprender más →</span>
            </div>
          </div>
          
          <div class="level-card" data-level="2" tabindex="0" role="button">
            <div class="level-header">
              <span class="level-icon">🌉</span>
              <h3>${i18n.t('altar.level2')}</h3>
            </div>
            <p>${i18n.t('altar.level2_description')}</p>
            <div class="level-action">
              <span class="learn-more-text">Aprender más →</span>
            </div>
          </div>
          
          <div class="level-card" data-level="3" tabindex="0" role="button">
            <div class="level-header">
              <span class="level-icon">☁️</span>
              <h3>${i18n.t('altar.level3')}</h3>
            </div>
            <p>${i18n.t('altar.level3_description')}</p>
            <div class="level-action">
              <span class="learn-more-text">Aprender más →</span>
            </div>
          </div>
        </div>
      `
      
      // Add event listeners for level cards
      interactiveContent.querySelectorAll('.level-card').forEach(card => {
        card.addEventListener('click', () => {
          const level = parseInt(card.dataset.level)
          this.educationalContent.showLevelContent(level)
        })
        
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            card.click()
          }
        })
      })
      
      panel.appendChild(interactiveContent)
    }
  }

  /**
   * Load offerings interactive content
   */
  loadOfferingsContent() {
    const panel = document.getElementById('offerings-panel')
    if (!panel.querySelector('.offerings-interactive')) {
      const interactiveContent = document.createElement('div')
      interactiveContent.className = 'offerings-interactive'
      interactiveContent.innerHTML = `
        <div class="offerings-categories">
          <div class="category-card" data-category="essential" tabindex="0" role="button">
            <div class="category-header">
              <span class="category-icon">⚡</span>
              <h3>Elementos Esenciales</h3>
            </div>
            <p>Los cuatro elementos básicos que no pueden faltar</p>
            <div class="category-items">
              <span class="item-preview">💧 🧂 🕯️ 🔥</span>
            </div>
          </div>
          
          <div class="category-card" data-category="flowers" tabindex="0" role="button">
            <div class="category-header">
              <span class="category-icon">🌼</span>
              <h3>Flores y Decoración</h3>
            </div>
            <p>Flores que guían y adornan el camino</p>
            <div class="category-items">
              <span class="item-preview">🌼 🌸 👑</span>
            </div>
          </div>
          
          <div class="category-card" data-category="food" tabindex="0" role="button">
            <div class="category-header">
              <span class="category-icon">🍞</span>
              <h3>Alimentos Tradicionales</h3>
            </div>
            <p>Comida sagrada y favorita de los difuntos</p>
            <div class="category-items">
              <span class="item-preview">🍞 🍎 🍬 🍽️</span>
            </div>
          </div>
          
          <div class="category-card" data-category="personal" tabindex="0" role="button">
            <div class="category-header">
              <span class="category-icon">📷</span>
              <h3>Elementos Personales</h3>
            </div>
            <p>Objetos que conectan con la individualidad</p>
            <div class="category-items">
              <span class="item-preview">📷 💎 🎵 🧸</span>
            </div>
          </div>
        </div>
      `
      
      // Add event listeners for category cards
      interactiveContent.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
          const category = card.dataset.category
          this.showOfferingCategory(category)
        })
        
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            card.click()
          }
        })
      })
      
      panel.appendChild(interactiveContent)
    }
  }

  /**
   * Show specific offering category
   */
  showOfferingCategory(category) {
    // This would show detailed information about the offering category
    // For now, we'll show a simple alert, but this could be expanded
    // to show detailed modals with offering information
    console.log(`Showing offering category: ${category}`)
  }

  /**
   * Render overview panel
   */
  renderOverviewPanel() {
    return `
      <div class="overview-content">
        <div class="welcome-section">
          <div class="welcome-text">
            <h2>Bienvenido a la Experiencia Educativa de Mictla</h2>
            <p class="lead">
              Descubre la rica tradición del Día de Muertos y cómo se conecta con los temas 
              universales de familia, memoria y amor que nos enseña la película Coco.
            </p>
          </div>
          
          <div class="overview-grid">
            <div class="overview-card">
              <div class="card-icon">🏛️</div>
              <h3>Tradiciones Auténticas</h3>
              <p>Aprende sobre los niveles del altar y su significado espiritual profundo.</p>
            </div>
            
            <div class="overview-card">
              <div class="card-icon">🎁</div>
              <h3>Ofrendas Sagradas</h3>
              <p>Descubre el propósito y simbolismo de cada elemento tradicional.</p>
            </div>
            
            <div class="overview-card">
              <div class="card-icon">🎬</div>
              <h3>Conexión con Coco</h3>
              <p>Explora cómo la película refleja las enseñanzas del Día de Muertos.</p>
            </div>
            
            <div class="overview-card">
              <div class="card-icon">🙏</div>
              <h3>Respeto Cultural</h3>
              <p>Aprende a honrar estas tradiciones de manera auténtica y respetuosa.</p>
            </div>
          </div>
        </div>
        
        <div class="featured-quote">
          <blockquote>
            <p>"${i18n.t('coco.quote1')}"</p>
            <cite>- Coco (Disney/Pixar)</cite>
          </blockquote>
        </div>
        
        <div class="getting-started">
          <h3>¿Por dónde empezar?</h3>
          <div class="start-options">
            <button class="start-option" data-section="altar-levels">
              <span class="option-icon">📚</span>
              <div class="option-content">
                <h4>Explora las Tradiciones</h4>
                <p>Comienza con los niveles del altar</p>
              </div>
            </button>
            
            <button class="start-option" data-section="coco-themes">
              <span class="option-icon">🎬</span>
              <div class="option-content">
                <h4>Temas de Coco</h4>
                <p>Descubre las conexiones culturales</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    `
  }

  /**
   * Render altar levels panel
   */
  renderAltarLevelsPanel() {
    return `
      <div class="altar-levels-content">
        <div class="section-intro">
          <h2>Los Tres Niveles del Altar</h2>
          <p>
            El altar de muertos tradicional se construye en tres niveles que representan 
            el viaje espiritual desde la tierra hasta el cielo. Cada nivel tiene su 
            propio significado y elementos específicos.
          </p>
        </div>
        
        <!-- Interactive content will be loaded here -->
      </div>
    `
  }

  /**
   * Render offerings panel
   */
  renderOfferingsPanel() {
    return `
      <div class="offerings-content">
        <div class="section-intro">
          <h2>Guía de Ofrendas Tradicionales</h2>
          <p>
            Cada elemento colocado en el altar tiene un propósito específico y un 
            significado profundo. Aprende sobre las diferentes categorías de ofrendas 
            y cómo cada una contribuye a honrar a nuestros seres queridos.
          </p>
        </div>
        
        <!-- Interactive content will be loaded here -->
      </div>
    `
  }

  /**
   * Handle language change
   */
  onLanguageChange(language) {
    // Re-render content with new language
    if (this.isInitialized) {
      this.render()
    }
  }

  /**
   * Handle educational content shown event
   */
  onEducationalContentShown(event) {
    const { type, data } = event.detail
    console.log(`Educational content shown: ${type}`, data)
  }

  /**
   * Show error message
   */
  showError(error) {
    this.container.innerHTML = `
      <div class="educational-error">
        <div class="container">
          <h2>Error al cargar contenido educativo</h2>
          <p>Ocurrió un error al inicializar la vista educativa:</p>
          <pre>${error.message}</pre>
          <button onclick="window.location.reload()" class="btn btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    `
  }

  /**
   * Dispose view
   */
  dispose() {
    if (this.educationalContent) {
      this.educationalContent.dispose()
    }
    
    if (this.cocoReferences) {
      this.cocoReferences.dispose()
    }
    
    this.isInitialized = false
    console.log('🧹 Educational View disposed')
  }
}
/**
 * Educational Content Component
 * Manages cultural information about Day of the Dead traditions
 * Includes comprehensive accessibility features
 */

import { i18n } from '../../i18n/i18n.js'
import { appState } from '../../state/AppState.js'
import { accessibilityManager } from '../../utils/accessibility.js'
import MCPService from '../../services/MCPService.js'

export class EducationalContentComponent {
  constructor(container) {
    this.container = container
    this.currentLevel = null
    this.isInitialized = false
    this.audioElements = new Map()
  }

  /**
   * Initialize the educational content system
   */
  async init() {
    if (this.isInitialized) return

    console.log('📚 Initializing Educational Content Component...')

    try {
      // Initialize MCP services
      await MCPService.initialize()
      
      // Load cultural data
      await this.loadCulturalData()
      
      // Setup event listeners
      this.setupEventListeners()
      
      this.isInitialized = true
      console.log('✅ Educational Content Component initialized')
      
    } catch (error) {
      console.error('❌ Failed to initialize Educational Content Component:', error)
      throw error
    }
  }

  /**
   * Load cultural data and content
   */
  async loadCulturalData() {
    // Import cultural data
    const { culturalData } = await import('../../utils/culturalData.js')
    this.culturalData = culturalData
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for altar level interactions
    document.addEventListener('altar-level-clicked', this.onLevelClicked.bind(this))
    
    // Listen for offering interactions
    document.addEventListener('offering-clicked', this.onOfferingClicked.bind(this))
    
    // Listen for language changes
    appState.subscribe('user.language', this.onLanguageChange.bind(this))
  }

  /**
   * Handle altar level click
   */
  onLevelClicked(event) {
    const { level } = event.detail
    this.showLevelContent(level)
  }

  /**
   * Handle offering click
   */
  onOfferingClicked(event) {
    const { offeringType } = event.detail
    this.showOfferingContent(offeringType)
  }

  /**
   * Handle language change
   */
  onLanguageChange(language) {
    if (this.currentLevel) {
      this.showLevelContent(this.currentLevel)
    }
  }

  /**
   * Show educational content for a specific altar level
   */
  async showLevelContent(level) {
    this.currentLevel = level
    const levelData = this.culturalData.altarLevels[level]
    
    if (!levelData) {
      console.warn(`No cultural data found for level ${level}`)
      return
    }

    // Translate content if needed
    const currentLang = appState.get('user.language') || 'es'
    const translatedData = await this.translateContentIfNeeded(levelData, currentLang)

    // Create content modal
    const modal = this.createContentModal(translatedData, 'level')
    document.body.appendChild(modal)
    
    // Dispatch event for other components
    document.dispatchEvent(new CustomEvent('educational-content-shown', {
      detail: { type: 'level', level, data: translatedData }
    }))
  }

  /**
   * Show Coco themes educational content
   */
  showCocoThemes() {
    const cocoData = this.culturalData.cocoThemes
    
    if (!cocoData) {
      console.warn('No Coco themes data found')
      return
    }

    // Create content modal for Coco themes
    const modal = this.createCocoThemesModal(cocoData)
    document.body.appendChild(modal)
    
    // Dispatch event for other components
    document.dispatchEvent(new CustomEvent('educational-content-shown', {
      detail: { type: 'coco-themes', data: cocoData }
    }))
  }

  /**
   * Show specific Coco theme
   */
  showCocoTheme(themeKey) {
    const themeData = this.culturalData.cocoThemes[themeKey]
    
    if (!themeData) {
      console.warn(`No Coco theme data found for ${themeKey}`)
      return
    }

    // Create content modal for specific theme
    const modal = this.createCocoThemeModal(themeData, themeKey)
    document.body.appendChild(modal)
    
    // Dispatch event for other components
    document.dispatchEvent(new CustomEvent('educational-content-shown', {
      detail: { type: 'coco-theme', themeKey, data: themeData }
    }))
  }

  /**
   * Show cultural context with Coco connections
   */
  showCulturalContext(contextType, itemData) {
    const currentLang = appState.get('user.language') || 'es'
    
    // Create enhanced cultural context modal
    const modal = this.createCulturalContextModal(contextType, itemData, currentLang)
    document.body.appendChild(modal)
    
    // Dispatch event for other components
    document.dispatchEvent(new CustomEvent('educational-content-shown', {
      detail: { type: 'cultural-context', contextType, data: itemData }
    }))
  }

  /**
   * Show respectful practices guide
   */
  showRespectfulPractices() {
    const practicesData = this.culturalData.traditionalOfferings.respectfulPractices
    
    if (!practicesData) {
      console.warn('No respectful practices data found')
      return
    }

    // Create content modal for respectful practices
    const modal = this.createRespectfulPracticesModal(practicesData)
    document.body.appendChild(modal)
    
    // Dispatch event for other components
    document.dispatchEvent(new CustomEvent('educational-content-shown', {
      detail: { type: 'respectful-practices', data: practicesData }
    }))
  }

  /**
   * Show educational content for a specific offering
   */
  showOfferingContent(offeringType) {
    const offeringData = this.culturalData.offerings[offeringType]
    
    if (!offeringData) {
      console.warn(`No cultural data found for offering ${offeringType}`)
      return
    }

    // Create content modal
    const modal = this.createContentModal(offeringData, 'offering')
    document.body.appendChild(modal)
    
    // Dispatch event for other components
    document.dispatchEvent(new CustomEvent('educational-content-shown', {
      detail: { type: 'offering', offeringType, data: offeringData }
    }))
  }

  /**
   * Create content modal with accessibility features
   */
  createContentModal(data, type) {
    const currentLang = appState.get('user.language') || 'es'
    const content = data[currentLang] || data.es
    
    // Create modal content
    const modalContent = document.createElement('div')
    modalContent.innerHTML = `
      <div class="modal-header">
        <h2 id="modal-title">${content.name}</h2>
        <button class="close-button" aria-label="${i18n.t('ui.close')}" tabindex="0">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      
      <div class="modal-body" id="modal-content" role="document" tabindex="0">
        ${this.renderContentSections(content, type)}
      </div>
      
      <div class="modal-footer">
        <button class="close-modal-btn" tabindex="0">
          ${i18n.t('ui.close')}
        </button>
      </div>
    `
    
    // Create accessible modal using accessibility manager
    const modal = accessibilityManager.createAccessibleModal(modalContent, {
      title: content.name,
      closeLabel: i18n.t('ui.close'),
      trapFocus: true,
      closeOnEscape: true,
      closeOnOverlay: true
    })
    
    modal.className = `educational-modal ${type}-modal`
    
    // Add keyboard navigation support
    modal.setAttribute('data-keyboard-navigation', 'list')
    
    // Add event listeners
    this.setupModalEventListeners(modal)
    
    // Announce modal opening to screen readers
    accessibilityManager.announce(`${i18n.t('education.title')}: ${content.name}`)
    
    return modal
  }

  /**
   * Render content sections based on type
   */
  renderContentSections(content, type) {
    let sections = ''
    
    // Description section
    if (content.description) {
      sections += `
        <section class="content-section description-section">
          <h3>${i18n.t('education.cultural_meaning')}</h3>
          <p>${content.description}</p>
        </section>
      `
    }
    
    // Cultural meaning section
    if (content.meaning) {
      sections += `
        <section class="content-section meaning-section">
          <h3>Significado Cultural</h3>
          <p>${content.meaning}</p>
        </section>
      `
    }
    
    // Coco connection section
    if (content.cocoConnection) {
      sections += `
        <section class="content-section coco-section">
          <h3>${i18n.t('education.coco_connection')}</h3>
          <div class="coco-content">
            <p>${content.cocoConnection.description}</p>
            ${content.cocoConnection.quote ? `
              <blockquote class="coco-quote">
                <p>"${content.cocoConnection.quote}"</p>
                <cite>- Coco (Disney/Pixar)</cite>
              </blockquote>
            ` : ''}
            ${content.cocoConnection.scene ? `
              <div class="scene-reference">
                <h4>Escena relacionada:</h4>
                <p>${content.cocoConnection.scene}</p>
              </div>
            ` : ''}
          </div>
        </section>
      `
    }
    
    // Traditional offerings section (for levels)
    if (type === 'level' && content.traditionalOfferings) {
      sections += `
        <section class="content-section offerings-section">
          <h3>Ofrendas Tradicionales</h3>
          <div class="offerings-grid" role="grid" data-keyboard-navigation="grid" aria-label="Ofrendas tradicionales">
            ${content.traditionalOfferings.map((offering, index) => `
              <div class="offering-item" 
                   data-offering="${offering.type}" 
                   role="gridcell"
                   tabindex="${index === 0 ? '0' : '-1'}"
                   aria-label="${offering.name}: ${offering.purpose}">
                <span class="offering-icon" aria-hidden="true">${offering.icon}</span>
                <div class="offering-info">
                  <h4>${offering.name}</h4>
                  <p>${offering.purpose}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </section>
      `
    }
    
    // Audio explanation section
    if (content.audioExplanation) {
      sections += `
        <section class="content-section audio-section">
          <h3>Explicación en Audio</h3>
          <div class="audio-controls" role="group" aria-label="Controles de audio">
            <button class="play-audio-btn" 
                    data-audio="${content.audioExplanation}" 
                    tabindex="0"
                    aria-label="Reproducir explicación en audio"
                    aria-describedby="audio-description">
              <span class="audio-icon" aria-hidden="true">🔊</span>
              <span class="audio-text">Escuchar Explicación</span>
            </button>
            <div id="audio-description" class="sr-only">
              Reproducir explicación cultural en audio sobre ${content.name}
            </div>
            <div class="audio-progress" 
                 style="display: none;" 
                 role="progressbar" 
                 aria-label="Progreso de reproducción"
                 aria-valuemin="0" 
                 aria-valuemax="100" 
                 aria-valuenow="0">
              <div class="progress-bar"></div>
              <span class="audio-time" aria-live="polite">0:00 / 0:00</span>
            </div>
          </div>
        </section>
      `
    }
    
    // Family importance section (Coco theme)
    if (content.familyImportance) {
      sections += `
        <section class="content-section family-section">
          <h3>${i18n.t('education.family_importance')}</h3>
          <div class="family-content">
            <p>${content.familyImportance.description}</p>
            <div class="family-values">
              <h4>Valores familiares en el Día de Muertos:</h4>
              <ul>
                ${content.familyImportance.values.map(value => `<li>${value}</li>`).join('')}
              </ul>
            </div>
          </div>
        </section>
      `
    }
    
    return sections
  }

  /**
   * Setup modal event listeners
   */
  setupModalEventListeners(modal) {
    // Close button
    const closeButton = modal.querySelector('.close-button')
    const closeModalBtn = modal.querySelector('.close-modal-btn')
    const overlay = modal.querySelector('.modal-overlay')
    
    const closeModal = () => {
      this.closeModal(modal)
    }
    
    closeButton.addEventListener('click', closeModal)
    closeModalBtn.addEventListener('click', closeModal)
    overlay.addEventListener('click', closeModal)
    
    // Keyboard navigation
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal()
      }
      
      // Tab trapping
      if (e.key === 'Tab') {
        this.trapFocus(modal, e)
      }
    })
    
    // Audio controls
    const audioButtons = modal.querySelectorAll('.play-audio-btn')
    audioButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const audioSrc = e.target.closest('.play-audio-btn').dataset.audio
        this.playAudioExplanation(audioSrc, btn)
      })
    })
    
    // Offering item clicks with keyboard support
    const offeringItems = modal.querySelectorAll('.offering-item')
    offeringItems.forEach(item => {
      // Click handler
      item.addEventListener('click', (e) => {
        const offeringType = e.target.closest('.offering-item').dataset.offering
        accessibilityManager.announce(`Abriendo información sobre ${offeringType}`)
        this.closeModal(modal)
        setTimeout(() => {
          this.showOfferingContent(offeringType)
        }, 300)
      })
      
      // Keyboard handler
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          item.click()
        }
      })
      
      // Focus management for grid navigation
      item.addEventListener('focus', () => {
        // Update tabindex for roving tabindex pattern
        offeringItems.forEach(otherItem => {
          otherItem.setAttribute('tabindex', '-1')
        })
        item.setAttribute('tabindex', '0')
      })
    })
    
    // Focus management
    setTimeout(() => {
      const firstFocusable = modal.querySelector('button, [tabindex="0"]')
      if (firstFocusable) {
        firstFocusable.focus()
      }
    }, 100)
  }

  /**
   * Trap focus within modal
   */
  trapFocus(modal, event) {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  /**
   * Play audio explanation with accessibility features
   */
  async playAudioExplanation(audioSrc, button) {
    try {
      // Stop any currently playing audio
      this.stopAllAudio()
      
      // Create or get audio element
      let audio = this.audioElements.get(audioSrc)
      if (!audio) {
        audio = new Audio(audioSrc)
        this.audioElements.set(audioSrc, audio)
      }
      
      const audioText = button.querySelector('.audio-text')
      const progressContainer = button.parentElement.querySelector('.audio-progress')
      const progressBar = progressContainer.querySelector('.progress-bar')
      const timeDisplay = progressContainer.querySelector('.audio-time')
      
      // Update UI and accessibility attributes
      audioText.textContent = 'Reproduciendo...'
      button.disabled = true
      button.setAttribute('aria-pressed', 'true')
      button.setAttribute('aria-label', 'Pausar explicación en audio')
      progressContainer.style.display = 'block'
      
      // Announce to screen readers
      accessibilityManager.announce('Reproduciendo explicación en audio')
      
      // Setup audio event listeners
      audio.addEventListener('loadedmetadata', () => {
        const duration = this.formatTime(audio.duration)
        timeDisplay.textContent = `0:00 / ${duration}`
        progressContainer.setAttribute('aria-valuemax', Math.floor(audio.duration))
      })
      
      audio.addEventListener('timeupdate', () => {
        const progress = (audio.currentTime / audio.duration) * 100
        const currentTime = Math.floor(audio.currentTime)
        
        progressBar.style.width = `${progress}%`
        progressContainer.setAttribute('aria-valuenow', currentTime)
        timeDisplay.textContent = `${this.formatTime(audio.currentTime)} / ${this.formatTime(audio.duration)}`
      })
      
      audio.addEventListener('ended', () => {
        audioText.textContent = 'Escuchar Explicación'
        button.disabled = false
        button.setAttribute('aria-pressed', 'false')
        button.setAttribute('aria-label', 'Reproducir explicación en audio')
        progressContainer.style.display = 'none'
        progressContainer.setAttribute('aria-valuenow', '0')
        progressBar.style.width = '0%'
        
        // Announce completion
        accessibilityManager.announce('Explicación en audio completada')
      })
      
      audio.addEventListener('error', () => {
        audioText.textContent = 'Error de Audio'
        button.disabled = false
        button.setAttribute('aria-pressed', 'false')
        button.setAttribute('aria-label', 'Error al reproducir audio')
        
        // Announce error
        accessibilityManager.announce('Error al reproducir el audio')
      })
      
      // Play audio
      await audio.play()
      
    } catch (error) {
      console.error('Error playing audio:', error)
      button.querySelector('.audio-text').textContent = 'Error de Audio'
      button.disabled = false
      button.setAttribute('aria-pressed', 'false')
      accessibilityManager.announce('Error al reproducir el audio')
    }
  }

  /**
   * Stop all playing audio
   */
  stopAllAudio() {
    this.audioElements.forEach(audio => {
      if (!audio.paused) {
        audio.pause()
        audio.currentTime = 0
      }
    })
  }

  /**
   * Format time for display
   */
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  /**
   * Close modal
   */
  closeModal(modal) {
    // Stop any playing audio
    this.stopAllAudio()
    
    // Add closing animation
    modal.classList.add('closing')
    
    setTimeout(() => {
      if (modal.parentElement) {
        document.body.removeChild(modal)
      }
    }, 300)
    
    // Return focus to trigger element if possible
    const triggerElement = document.querySelector('[data-educational-trigger]')
    if (triggerElement) {
      triggerElement.focus()
    }
  }

  /**
   * Get cultural content for specific level
   */
  getLevelContent(level) {
    return this.culturalData?.altarLevels?.[level] || null
  }

  /**
   * Get cultural content for specific offering
   */
  getOfferingContent(offeringType) {
    return this.culturalData?.offerings?.[offeringType] || null
  }

  /**
   * Create Coco themes modal
   */
  createCocoThemesModal(cocoData) {
    const currentLang = appState.get('user.language') || 'es'
    
    const modalContent = document.createElement('div')
    modalContent.innerHTML = `
      <div class="modal-header">
        <h2 id="modal-title">${i18n.t('education.coco_connection')}</h2>
        <button class="close-button" aria-label="${i18n.t('ui.close')}" tabindex="0">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      
      <div class="modal-body coco-themes-content" id="modal-content" role="document" tabindex="0">
        ${this.renderCocoThemesContent(cocoData, currentLang)}
      </div>
      
      <div class="modal-footer">
        <button class="close-modal-btn" tabindex="0">
          ${i18n.t('ui.close')}
        </button>
      </div>
    `
    
    // Create accessible modal
    const modal = accessibilityManager.createAccessibleModal(modalContent, {
      title: i18n.t('education.coco_connection'),
      closeLabel: i18n.t('ui.close'),
      trapFocus: true,
      closeOnEscape: true,
      closeOnOverlay: true
    })
    
    modal.className = 'educational-modal coco-themes-modal'
    
    // Add event listeners
    this.setupModalEventListeners(modal)
    
    // Announce modal opening
    accessibilityManager.announce(`${i18n.t('education.coco_connection')} - Temas de la película Coco`)
    
    return modal
  }

  /**
   * Create respectful practices modal
   */
  createRespectfulPracticesModal(practicesData) {
    const currentLang = appState.get('user.language') || 'es'
    const content = practicesData[currentLang] || practicesData.es
    
    const modalContent = document.createElement('div')
    modalContent.innerHTML = `
      <div class="modal-header">
        <h2 id="modal-title">${content.title}</h2>
        <button class="close-button" aria-label="${i18n.t('ui.close')}" tabindex="0">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      
      <div class="modal-body respectful-practices-content" id="modal-content" role="document" tabindex="0">
        ${this.renderRespectfulPracticesContent(content)}
      </div>
      
      <div class="modal-footer">
        <button class="close-modal-btn" tabindex="0">
          ${i18n.t('ui.close')}
        </button>
      </div>
    `
    
    // Create accessible modal
    const modal = accessibilityManager.createAccessibleModal(modalContent, {
      title: content.title,
      closeLabel: i18n.t('ui.close'),
      trapFocus: true,
      closeOnEscape: true,
      closeOnOverlay: true
    })
    
    modal.className = 'educational-modal respectful-practices-modal'
    
    // Add event listeners
    this.setupModalEventListeners(modal)
    
    // Announce modal opening
    accessibilityManager.announce(`${content.title} - Guía cultural`)
    
    return modal
  }

  /**
   * Render Coco themes content
   */
  renderCocoThemesContent(cocoData, currentLang) {
    let content = `
      <div class="coco-intro">
        <p class="intro-text">
          ${currentLang === 'es' 
            ? 'La película Coco de Disney/Pixar nos enseña valiosas lecciones sobre la familia, la memoria y las tradiciones que se reflejan perfectamente en el Día de Muertos.'
            : 'Disney/Pixar\'s Coco teaches us valuable lessons about family, memory, and traditions that are perfectly reflected in the Day of the Dead.'
          }
        </p>
      </div>
      
      <div class="themes-container">
    `
    
    // Render each theme
    Object.entries(cocoData).forEach(([themeKey, themeData]) => {
      const theme = themeData[currentLang] || themeData.es
      
      content += `
        <section class="theme-section" data-theme="${themeKey}">
          <h3 class="theme-title">${theme.title}</h3>
          
          <div class="theme-description">
            <p>${theme.description}</p>
          </div>
          
          <div class="theme-connection">
            <h4>Conexión con el Día de Muertos:</h4>
            <p>${theme.connection}</p>
          </div>
          
          ${theme.keyLessons ? `
            <div class="key-lessons">
              <h4>Lecciones Clave:</h4>
              <ul>
                ${theme.keyLessons.map(lesson => `<li>${lesson}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${theme.practicalApplication ? `
            <div class="practical-application">
              <h4>Aplicación en Mictla:</h4>
              <p class="application-text">${theme.practicalApplication}</p>
            </div>
          ` : ''}
          
          ${theme.cocoMoments ? `
            <div class="coco-moments">
              <h4>Momentos Clave en Coco:</h4>
              <ul>
                ${theme.cocoMoments.map(moment => `<li>${moment}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          ${theme.symbolism ? `
            <div class="symbolism">
              <h4>Simbolismo:</h4>
              <div class="symbolism-items">
                ${Object.entries(theme.symbolism).map(([key, value]) => `
                  <div class="symbolism-item">
                    <strong>${key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</strong>
                    <span>${value}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${theme.rememberingActions ? `
            <div class="remembering-actions">
              <h4>Acciones para Recordar:</h4>
              <ul>
                ${theme.rememberingActions.map(action => `<li>${action}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </section>
      `
    })
    
    content += `
      </div>
      
      <div class="coco-quotes">
        <h3>Frases Memorables de Coco</h3>
        <div class="quotes-grid">
          <blockquote class="coco-quote">
            <p>"${i18n.t('coco.quote1')}"</p>
            <cite>- Coco (Disney/Pixar)</cite>
          </blockquote>
          <blockquote class="coco-quote">
            <p>"${i18n.t('coco.quote2')}"</p>
            <cite>- Coco (Disney/Pixar)</cite>
          </blockquote>
          <blockquote class="coco-quote">
            <p>"${i18n.t('coco.quote3')}"</p>
            <cite>- Coco (Disney/Pixar)</cite>
          </blockquote>
          <blockquote class="coco-quote">
            <p>"${i18n.t('coco.quote4')}"</p>
            <cite>- Coco (Disney/Pixar)</cite>
          </blockquote>
        </div>
      </div>
    `
    
    return content
  }

  /**
   * Render respectful practices content
   */
  renderRespectfulPracticesContent(content) {
    return `
      <div class="practices-intro">
        <p class="intro-text">${content.description}</p>
      </div>
      
      <section class="guidelines-section">
        <h3>Guías Fundamentales</h3>
        <div class="guidelines-list">
          ${content.guidelines.map(guideline => `
            <div class="guideline-item">
              <span class="guideline-icon" aria-hidden="true">🌼</span>
              <p>${guideline}</p>
            </div>
          `).join('')}
        </div>
      </section>
      
      <section class="cultural-sensitivity-section">
        <h3>Sensibilidad Cultural</h3>
        <div class="sensitivity-list">
          ${content.culturalSensitivity.map(item => `
            <div class="sensitivity-item">
              <span class="sensitivity-icon" aria-hidden="true">🙏</span>
              <p>${item}</p>
            </div>
          `).join('')}
        </div>
      </section>
      
      <div class="respect-reminder">
        <h4>Recordatorio Importante</h4>
        <p>
          ${content.description.includes('auténtica') 
            ? 'El Día de Muertos es una tradición sagrada que merece ser honrada con respeto y autenticidad. Al participar en esta celebración, nos convertimos en guardianes de una herencia cultural milenaria.'
            : 'The Day of the Dead is a sacred tradition that deserves to be honored with respect and authenticity. By participating in this celebration, we become guardians of a millennial cultural heritage.'
          }
        </p>
      </div>
    `
  }

  /**
   * Translate content if needed using MCP translation service
   */
  async translateContentIfNeeded(data, targetLanguage) {
    // If content already exists in target language, return it
    if (data[targetLanguage]) {
      return data
    }

    // If we have Spanish content and need English, translate it
    if (targetLanguage === 'en' && data.es) {
      try {
        const translatedData = { ...data }
        const sourceContent = data.es

        // Translate key fields
        if (sourceContent.name) {
          translatedData.en = { ...sourceContent }
          translatedData.en.name = await MCPService.translateText(sourceContent.name, 'en', 'es')
        }
        
        if (sourceContent.description) {
          translatedData.en.description = await MCPService.translateText(sourceContent.description, 'en', 'es')
        }
        
        if (sourceContent.meaning) {
          translatedData.en.meaning = await MCPService.translateText(sourceContent.meaning, 'en', 'es')
        }

        // Translate Coco connection if present
        if (sourceContent.cocoConnection) {
          translatedData.en.cocoConnection = {
            description: await MCPService.translateText(sourceContent.cocoConnection.description, 'en', 'es'),
            quote: sourceContent.cocoConnection.quote, // Keep quotes in original language
            scene: sourceContent.cocoConnection.scene ? 
              await MCPService.translateText(sourceContent.cocoConnection.scene, 'en', 'es') : undefined
          }
        }

        return translatedData
      } catch (error) {
        console.warn('Translation failed, using original content:', error)
        return data
      }
    }

    return data
  }

  /**
   * Dispose component
   */
  dispose() {
    // Stop all audio
    this.stopAllAudio()
    
    // Clear audio elements
    this.audioElements.clear()
    
    // Remove event listeners
    document.removeEventListener('altar-level-clicked', this.onLevelClicked.bind(this))
    document.removeEventListener('offering-clicked', this.onOfferingClicked.bind(this))
    
    this.isInitialized = false
    console.log('🧹 Educational Content Component disposed')
  }
}
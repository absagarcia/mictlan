/**
 * Sharing Component
 * UI for export and sharing capabilities
 */

import { appState } from '../../state/AppState.js'
import { i18n } from '../../i18n/i18n.js'
import { exportService } from '../../services/ExportService.js'
import { Modal } from '../ui/Modal.js'
import { LoadingSpinner } from '../ui/LoadingSpinner.js'

export class SharingComponent {
  constructor(container) {
    this.container = container
    this.isInitialized = false
    this.selectedMemorials = new Set()
    this.currentModal = null
  }

  /**
   * Initialize sharing component
   */
  async init() {
    if (this.isInitialized) return

    console.log('📤 Initializing Sharing Component...')

    try {
      await exportService.init()
      this.render()
      this.setupEventListeners()
      
      this.isInitialized = true
      console.log('✅ Sharing Component initialized')
      
    } catch (error) {
      console.error('❌ Failed to initialize Sharing Component:', error)
      throw error
    }
  }

  /**
   * Render sharing interface
   */
  render() {
    if (!this.container) return

    const memorials = appState.get('memorials') || []
    const stats = exportService.getSharingStats()

    this.container.innerHTML = `
      <div class="sharing-component">
        <div class="sharing-header">
          <h2>📤 Compartir y Exportar</h2>
          <p>Comparte tus memorias familiares o exporta tu colección</p>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button class="btn btn-primary export-pdf-btn" ${memorials.length === 0 ? 'disabled' : ''}>
            📄 Exportar PDF
          </button>
          <button class="btn btn-outline export-json-btn" ${memorials.length === 0 ? 'disabled' : ''}>
            💾 Exportar JSON
          </button>
          <button class="btn btn-secondary create-share-btn" ${memorials.length === 0 ? 'disabled' : ''}>
            🔗 Crear Enlace
          </button>
          <button class="btn btn-outline social-share-btn" ${memorials.length === 0 ? 'disabled' : ''}>
            📱 Redes Sociales
          </button>
        </div>

        <!-- Memorial Selection -->
        ${memorials.length > 0 ? `
          <div class="memorial-selection">
            <h3>🎯 Seleccionar Memorias</h3>
            <div class="selection-controls">
              <button class="btn btn-sm btn-outline select-all-btn">
                Seleccionar Todas
              </button>
              <button class="btn btn-sm btn-outline select-none-btn">
                Deseleccionar Todas
              </button>
              <span class="selection-count">
                ${this.selectedMemorials.size} de ${memorials.length} seleccionadas
              </span>
            </div>
            
            <div class="memorial-grid">
              ${memorials.map(memorial => `
                <div class="memorial-card ${this.selectedMemorials.has(memorial.id) ? 'selected' : ''}" 
                     data-memorial-id="${memorial.id}">
                  <div class="memorial-checkbox">
                    <input type="checkbox" 
                           id="memorial-${memorial.id}" 
                           ${this.selectedMemorials.has(memorial.id) ? 'checked' : ''}
                           data-memorial-id="${memorial.id}">
                    <label for="memorial-${memorial.id}" class="sr-only">
                      Seleccionar ${memorial.name}
                    </label>
                  </div>
                  
                  ${memorial.photo ? `
                    <div class="memorial-photo">
                      <img src="${memorial.photo}" alt="${memorial.name}">
                    </div>
                  ` : `
                    <div class="memorial-photo-placeholder">
                      <span class="photo-icon">👤</span>
                    </div>
                  `}
                  
                  <div class="memorial-info">
                    <h4 class="memorial-name">${memorial.name}</h4>
                    <p class="memorial-relationship">
                      ${i18n.t(`relationships.${memorial.relationship}`) || memorial.relationship}
                    </p>
                    <div class="memorial-features">
                      ${memorial.story ? '<span class="feature-badge">📖</span>' : ''}
                      ${memorial.photo ? '<span class="feature-badge">📷</span>' : ''}
                      ${memorial.audioMessage ? '<span class="feature-badge">🎵</span>' : ''}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-icon">📝</div>
            <h3>No hay memorias para compartir</h3>
            <p>Crea algunas memorias familiares primero para poder exportarlas y compartirlas.</p>
            <a href="/memories" class="btn btn-primary">
              Crear Primera Memoria
            </a>
          </div>
        `}

        <!-- Sharing Statistics -->
        ${stats.totalShares > 0 ? `
          <div class="sharing-stats">
            <h3>📊 Estadísticas de Compartir</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <span class="stat-number">${stats.totalShares}</span>
                <span class="stat-label">Enlaces Creados</span>
              </div>
              <div class="stat-card">
                <span class="stat-number">${stats.activeShares}</span>
                <span class="stat-label">Enlaces Activos</span>
              </div>
              <div class="stat-card">
                <span class="stat-number">${stats.totalAccess}</span>
                <span class="stat-label">Accesos Totales</span>
              </div>
              <div class="stat-card">
                <span class="stat-number">${stats.memorialsShared}</span>
                <span class="stat-label">Memorias Compartidas</span>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Export buttons
    const exportPdfBtn = this.container.querySelector('.export-pdf-btn')
    const exportJsonBtn = this.container.querySelector('.export-json-btn')
    const createShareBtn = this.container.querySelector('.create-share-btn')
    const socialShareBtn = this.container.querySelector('.social-share-btn')

    exportPdfBtn?.addEventListener('click', () => this.showExportPDFModal())
    exportJsonBtn?.addEventListener('click', () => this.exportJSON())
    createShareBtn?.addEventListener('click', () => this.showCreateShareModal())
    socialShareBtn?.addEventListener('click', () => this.showSocialShareModal())

    // Selection controls
    const selectAllBtn = this.container.querySelector('.select-all-btn')
    const selectNoneBtn = this.container.querySelector('.select-none-btn')

    selectAllBtn?.addEventListener('click', () => this.selectAllMemorials())
    selectNoneBtn?.addEventListener('click', () => this.selectNoMemorials())

    // Memorial checkboxes
    const checkboxes = this.container.querySelectorAll('input[type="checkbox"][data-memorial-id]')
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        this.toggleMemorialSelection(e.target.dataset.memorialId, e.target.checked)
      })
    })

    // Memorial cards (click to toggle)
    const memorialCards = this.container.querySelectorAll('.memorial-card')
    memorialCards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.type === 'checkbox') return // Skip if clicking checkbox directly
        
        const memorialId = card.dataset.memorialId
        const checkbox = card.querySelector('input[type="checkbox"]')
        const isSelected = !checkbox.checked
        
        checkbox.checked = isSelected
        this.toggleMemorialSelection(memorialId, isSelected)
      })
    })

    // Listen for memorial changes
    appState.subscribe('memorials', () => {
      this.render()
      this.setupEventListeners()
    })
  }

  /**
   * Toggle memorial selection
   */
  toggleMemorialSelection(memorialId, selected) {
    if (selected) {
      this.selectedMemorials.add(memorialId)
    } else {
      this.selectedMemorials.delete(memorialId)
    }

    // Update UI
    const card = this.container.querySelector(`[data-memorial-id="${memorialId}"]`)
    if (card) {
      card.classList.toggle('selected', selected)
    }

    // Update selection count
    const countElement = this.container.querySelector('.selection-count')
    if (countElement) {
      const total = appState.get('memorials')?.length || 0
      countElement.textContent = `${this.selectedMemorials.size} de ${total} seleccionadas`
    }
  }

  /**
   * Select all memorials
   */
  selectAllMemorials() {
    const memorials = appState.get('memorials') || []
    memorials.forEach(memorial => {
      this.selectedMemorials.add(memorial.id)
    })

    // Update checkboxes and cards
    const checkboxes = this.container.querySelectorAll('input[type="checkbox"][data-memorial-id]')
    checkboxes.forEach(checkbox => {
      checkbox.checked = true
    })

    const cards = this.container.querySelectorAll('.memorial-card')
    cards.forEach(card => {
      card.classList.add('selected')
    })

    // Update count
    const countElement = this.container.querySelector('.selection-count')
    if (countElement) {
      countElement.textContent = `${memorials.length} de ${memorials.length} seleccionadas`
    }
  }

  /**
   * Select no memorials
   */
  selectNoMemorials() {
    this.selectedMemorials.clear()

    // Update checkboxes and cards
    const checkboxes = this.container.querySelectorAll('input[type="checkbox"][data-memorial-id]')
    checkboxes.forEach(checkbox => {
      checkbox.checked = false
    })

    const cards = this.container.querySelectorAll('.memorial-card')
    cards.forEach(card => {
      card.classList.remove('selected')
    })

    // Update count
    const countElement = this.container.querySelector('.selection-count')
    if (countElement) {
      const total = appState.get('memorials')?.length || 0
      countElement.textContent = `0 de ${total} seleccionadas`
    }
  }

  /**
   * Show export PDF modal
   */
  showExportPDFModal() {
    const selectedMemorials = this.getSelectedMemorials()
    
    this.currentModal = new Modal({
      title: '📄 Exportar a PDF',
      size: 'medium',
      content: this.generateExportPDFContent(selectedMemorials)
    })

    this.currentModal.show()
    this.setupExportPDFEvents()
  }

  /**
   * Generate export PDF modal content
   */
  generateExportPDFContent(selectedMemorials) {
    return `
      <div class="export-pdf-modal">
        <div class="export-summary">
          <h4>📊 Resumen de Exportación</h4>
          <div class="summary-stats">
            <div class="summary-item">
              <span class="summary-label">Memorias seleccionadas:</span>
              <span class="summary-value">${selectedMemorials.length}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Con fotografías:</span>
              <span class="summary-value">${selectedMemorials.filter(m => m.photo).length}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Con historias:</span>
              <span class="summary-value">${selectedMemorials.filter(m => m.story).length}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Con audio:</span>
              <span class="summary-value">${selectedMemorials.filter(m => m.audioMessage).length}</span>
            </div>
          </div>
        </div>

        <div class="export-options">
          <h4>⚙️ Opciones de Exportación</h4>
          
          <div class="option-group">
            <label class="option-label">
              <input type="text" id="pdf-title" class="form-input" 
                     value="Libro de Memorias Familiares" 
                     placeholder="Título del documento">
              <span>Título del PDF</span>
            </label>
          </div>

          <div class="option-group">
            <label class="option-checkbox">
              <input type="checkbox" id="include-photos" checked>
              <span class="checkmark"></span>
              Incluir fotografías
            </label>
          </div>

          <div class="option-group">
            <label class="option-checkbox">
              <input type="checkbox" id="include-stories" checked>
              <span class="checkmark"></span>
              Incluir historias
            </label>
          </div>

          <div class="option-group">
            <label class="option-checkbox">
              <input type="checkbox" id="include-audio-note">
              <span class="checkmark"></span>
              Incluir nota sobre mensajes de audio
            </label>
          </div>

          <div class="option-group">
            <label class="option-label">
              <select id="pdf-format" class="form-select">
                <option value="portrait">Vertical (Retrato)</option>
                <option value="landscape">Horizontal (Paisaje)</option>
              </select>
              <span>Orientación</span>
            </label>
          </div>
        </div>

        <div class="export-actions">
          <button class="btn btn-outline cancel-export-btn">
            Cancelar
          </button>
          <button class="btn btn-primary confirm-export-pdf-btn">
            📄 Generar PDF
          </button>
        </div>
      </div>
    `
  }

  /**
   * Setup export PDF modal events
   */
  setupExportPDFEvents() {
    const modal = this.currentModal.element

    // Cancel button
    const cancelBtn = modal.querySelector('.cancel-export-btn')
    cancelBtn?.addEventListener('click', () => {
      this.currentModal.hide()
    })

    // Confirm export button
    const confirmBtn = modal.querySelector('.confirm-export-pdf-btn')
    confirmBtn?.addEventListener('click', async () => {
      await this.exportPDF()
    })
  }

  /**
   * Export to PDF
   */
  async exportPDF() {
    const modal = this.currentModal.element
    const selectedMemorials = this.getSelectedMemorials()

    // Get options from modal
    const title = modal.querySelector('#pdf-title').value || 'Libro de Memorias Familiares'
    const includePhotos = modal.querySelector('#include-photos').checked
    const includeStories = modal.querySelector('#include-stories').checked
    const includeAudio = modal.querySelector('#include-audio-note').checked
    const format = modal.querySelector('#pdf-format').value

    try {
      // Show loading
      const loadingSpinner = LoadingSpinner.show({
        message: 'Generando PDF...',
        overlay: true
      })

      // Export PDF
      await exportService.exportToPDF({
        memorials: selectedMemorials,
        includePhotos,
        includeStories,
        includeAudio,
        format,
        title
      })

      // Hide loading
      loadingSpinner.hide()

      // Close modal
      this.currentModal.hide()

      // Show success notification
      appState.actions.showNotification({
        type: 'success',
        title: 'PDF Exportado',
        message: `Se ha generado el PDF "${title}" con ${selectedMemorials.length} memorias.`
      })

    } catch (error) {
      console.error('Export PDF failed:', error)
      
      // Show error notification
      appState.actions.showNotification({
        type: 'error',
        title: 'Error al Exportar PDF',
        message: 'No se pudo generar el PDF. Inténtalo de nuevo.'
      })
    }
  }

  /**
   * Export to JSON
   */
  async exportJSON() {
    const selectedMemorials = this.getSelectedMemorials()

    try {
      // Show loading
      const loadingSpinner = LoadingSpinner.show({
        message: 'Exportando JSON...',
        overlay: true
      })

      // Export JSON
      await exportService.exportToJSON({
        memorials: selectedMemorials,
        includeMetadata: true
      })

      // Hide loading
      loadingSpinner.hide()

      // Show success notification
      appState.actions.showNotification({
        type: 'success',
        title: 'JSON Exportado',
        message: `Se ha exportado un archivo JSON con ${selectedMemorials.length} memorias.`
      })

    } catch (error) {
      console.error('Export JSON failed:', error)
      
      // Show error notification
      appState.actions.showNotification({
        type: 'error',
        title: 'Error al Exportar JSON',
        message: 'No se pudo exportar el archivo JSON. Inténtalo de nuevo.'
      })
    }
  }

  /**
   * Show create share modal
   */
  showCreateShareModal() {
    const selectedMemorials = this.getSelectedMemorials()
    
    this.currentModal = new Modal({
      title: '🔗 Crear Enlace de Compartir',
      size: 'medium',
      content: this.generateCreateShareContent(selectedMemorials)
    })

    this.currentModal.show()
    this.setupCreateShareEvents()
  }

  /**
   * Generate create share modal content
   */
  generateCreateShareContent(selectedMemorials) {
    return `
      <div class="create-share-modal">
        <div class="share-summary">
          <h4>📊 Memorias a Compartir</h4>
          <p>Se compartirán ${selectedMemorials.length} memorias seleccionadas</p>
          
          <div class="memorial-preview">
            ${selectedMemorials.slice(0, 3).map(memorial => `
              <div class="preview-item">
                <span class="preview-name">${memorial.name}</span>
                <span class="preview-relationship">${memorial.relationship}</span>
              </div>
            `).join('')}
            ${selectedMemorials.length > 3 ? `
              <div class="preview-more">
                +${selectedMemorials.length - 3} más
              </div>
            ` : ''}
          </div>
        </div>

        <div class="share-options">
          <h4>⚙️ Opciones de Compartir</h4>
          
          <div class="option-group">
            <label class="option-label">
              <select id="expiration-days" class="form-select">
                <option value="7">7 días</option>
                <option value="30" selected>30 días</option>
                <option value="90">90 días</option>
                <option value="365">1 año</option>
              </select>
              <span>Expiración del enlace</span>
            </label>
          </div>

          <div class="option-group">
            <label class="option-label">
              <input type="password" id="share-password" class="form-input" 
                     placeholder="Opcional">
              <span>Contraseña de protección</span>
            </label>
          </div>

          <div class="option-group">
            <label class="option-checkbox">
              <input type="checkbox" id="allow-download" checked>
              <span class="checkmark"></span>
              Permitir descarga
            </label>
          </div>
        </div>

        <div class="share-actions">
          <button class="btn btn-outline cancel-share-btn">
            Cancelar
          </button>
          <button class="btn btn-primary create-link-btn">
            🔗 Crear Enlace
          </button>
        </div>
      </div>
    `
  }

  /**
   * Setup create share modal events
   */
  setupCreateShareEvents() {
    const modal = this.currentModal.element

    // Cancel button
    const cancelBtn = modal.querySelector('.cancel-share-btn')
    cancelBtn?.addEventListener('click', () => {
      this.currentModal.hide()
    })

    // Create link button
    const createBtn = modal.querySelector('.create-link-btn')
    createBtn?.addEventListener('click', async () => {
      await this.createSharingLink()
    })
  }

  /**
   * Create sharing link
   */
  async createSharingLink() {
    const modal = this.currentModal.element
    const selectedMemorials = this.getSelectedMemorials()

    // Get options from modal
    const expirationDays = parseInt(modal.querySelector('#expiration-days').value)
    const password = modal.querySelector('#share-password').value || null
    const allowDownload = modal.querySelector('#allow-download').checked

    try {
      // Show loading
      const loadingSpinner = LoadingSpinner.show({
        message: 'Creando enlace...',
        overlay: true
      })

      // Create sharing link
      const shareData = await exportService.createSharingLink(
        selectedMemorials.map(m => m.id),
        { expirationDays, password, allowDownload }
      )

      // Hide loading
      loadingSpinner.hide()

      // Close modal and show success modal
      this.currentModal.hide()
      this.showSharingLinkSuccess(shareData)

    } catch (error) {
      console.error('Create sharing link failed:', error)
      
      // Show error notification
      appState.actions.showNotification({
        type: 'error',
        title: 'Error al Crear Enlace',
        message: 'No se pudo crear el enlace de compartir. Inténtalo de nuevo.'
      })
    }
  }

  /**
   * Show sharing link success modal
   */
  showSharingLinkSuccess(shareData) {
    this.currentModal = new Modal({
      title: '✅ Enlace Creado',
      size: 'medium',
      content: `
        <div class="share-success">
          <div class="success-message">
            <h4>🎉 ¡Enlace creado exitosamente!</h4>
            <p>Tu enlace de compartir está listo. Compártelo con familiares y amigos.</p>
          </div>

          <div class="share-details">
            <div class="detail-item">
              <span class="detail-label">Memorias compartidas:</span>
              <span class="detail-value">${shareData.memorialCount}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Expira el:</span>
              <span class="detail-value">${shareData.expiresAt.toLocaleDateString()}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Código:</span>
              <span class="detail-value">${shareData.code}</span>
            </div>
          </div>

          <div class="share-url">
            <label class="url-label">Enlace para compartir:</label>
            <div class="url-container">
              <input type="text" class="url-input" value="${shareData.url}" readonly>
              <button class="btn btn-outline copy-url-btn" title="Copiar enlace">
                📋
              </button>
            </div>
          </div>

          <div class="share-quick-actions">
            <h5>Compartir rápidamente:</h5>
            <div class="quick-share-buttons">
              <button class="btn btn-sm btn-outline share-whatsapp-btn">
                💬 WhatsApp
              </button>
              <button class="btn btn-sm btn-outline share-telegram-btn">
                ✈️ Telegram
              </button>
              <button class="btn btn-sm btn-outline share-email-btn">
                📧 Email
              </button>
            </div>
          </div>
        </div>
      `
    })

    this.currentModal.show()
    this.setupSharingSuccessEvents(shareData)
  }

  /**
   * Setup sharing success modal events
   */
  setupSharingSuccessEvents(shareData) {
    const modal = this.currentModal.element

    // Copy URL button
    const copyBtn = modal.querySelector('.copy-url-btn')
    copyBtn?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareData.url)
        copyBtn.textContent = '✅'
        setTimeout(() => {
          copyBtn.textContent = '📋'
        }, 2000)
        
        appState.actions.showNotification({
          type: 'success',
          title: 'Enlace Copiado',
          message: 'El enlace se ha copiado al portapapeles.'
        })
      } catch (error) {
        console.error('Failed to copy URL:', error)
      }
    })

    // Quick share buttons
    const whatsappBtn = modal.querySelector('.share-whatsapp-btn')
    const telegramBtn = modal.querySelector('.share-telegram-btn')
    const emailBtn = modal.querySelector('.share-email-btn')

    whatsappBtn?.addEventListener('click', () => {
      exportService.shareOnSocialMedia('whatsapp', {
        message: `Mira estas memorias familiares que quiero compartir contigo 🌺`,
        url: shareData.url
      })
    })

    telegramBtn?.addEventListener('click', () => {
      exportService.shareOnSocialMedia('telegram', {
        message: `Memorias familiares compartidas desde Mictla`,
        url: shareData.url
      })
    })

    emailBtn?.addEventListener('click', () => {
      const subject = encodeURIComponent('Memorias Familiares - Mictla')
      const body = encodeURIComponent(`Hola,\n\nQuiero compartir contigo algunas memorias familiares especiales.\n\nPuedes verlas en este enlace: ${shareData.url}\n\nCreado con Mictla - Altar de Muertos AR\n\n¡Espero que las disfrutes!`)
      window.open(`mailto:?subject=${subject}&body=${body}`)
    })
  }

  /**
   * Show social share modal
   */
  showSocialShareModal() {
    this.currentModal = new Modal({
      title: '📱 Compartir en Redes Sociales',
      size: 'medium',
      content: this.generateSocialShareContent()
    })

    this.currentModal.show()
    this.setupSocialShareEvents()
  }

  /**
   * Generate social share modal content
   */
  generateSocialShareContent() {
    const memorialCount = this.selectedMemorials.size || appState.get('memorials')?.length || 0

    return `
      <div class="social-share-modal">
        <div class="share-message">
          <h4>📝 Personalizar Mensaje</h4>
          <textarea id="share-message" class="form-textarea" rows="4" 
                    placeholder="Escribe tu mensaje personalizado...">Preservando memorias familiares con Mictla 🌺 Una hermosa forma de honrar a nuestros seres queridos en el Día de Muertos. ${memorialCount} memorias y contando... #JSConfMX #DíaDeMuertos #Mictla #AR #Familia</textarea>
        </div>

        <div class="social-platforms">
          <h4>🌐 Plataformas</h4>
          <div class="platform-grid">
            <button class="platform-btn twitter-btn" data-platform="twitter">
              <div class="platform-icon">🐦</div>
              <div class="platform-info">
                <span class="platform-name">Twitter</span>
                <span class="platform-desc">Comparte con hashtags</span>
              </div>
            </button>

            <button class="platform-btn facebook-btn" data-platform="facebook">
              <div class="platform-icon">📘</div>
              <div class="platform-info">
                <span class="platform-name">Facebook</span>
                <span class="platform-desc">Comparte con amigos</span>
              </div>
            </button>

            <button class="platform-btn whatsapp-btn" data-platform="whatsapp">
              <div class="platform-icon">💬</div>
              <div class="platform-info">
                <span class="platform-name">WhatsApp</span>
                <span class="platform-desc">Envía a contactos</span>
              </div>
            </button>

            <button class="platform-btn telegram-btn" data-platform="telegram">
              <div class="platform-icon">✈️</div>
              <div class="platform-info">
                <span class="platform-name">Telegram</span>
                <span class="platform-desc">Comparte en chats</span>
              </div>
            </button>
          </div>
        </div>

        <div class="hashtag-suggestions">
          <h5>🏷️ Hashtags Sugeridos:</h5>
          <div class="hashtag-list">
            <span class="hashtag">#JSConfMX</span>
            <span class="hashtag">#DíaDeMuertos</span>
            <span class="hashtag">#Mictla</span>
            <span class="hashtag">#AR</span>
            <span class="hashtag">#Familia</span>
            <span class="hashtag">#Memorias</span>
            <span class="hashtag">#Tradición</span>
          </div>
        </div>
      </div>
    `
  }

  /**
   * Setup social share modal events
   */
  setupSocialShareEvents() {
    const modal = this.currentModal.element

    // Platform buttons
    const platformBtns = modal.querySelectorAll('.platform-btn')
    platformBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const platform = btn.dataset.platform
        const message = modal.querySelector('#share-message').value
        this.shareOnPlatform(platform, message)
      })
    })

    // Hashtag suggestions (click to add)
    const hashtags = modal.querySelectorAll('.hashtag')
    hashtags.forEach(hashtag => {
      hashtag.addEventListener('click', () => {
        const messageTextarea = modal.querySelector('#share-message')
        const currentMessage = messageTextarea.value
        const hashtagText = hashtag.textContent
        
        if (!currentMessage.includes(hashtagText)) {
          messageTextarea.value = currentMessage + ' ' + hashtagText
        }
      })
    })
  }

  /**
   * Share on specific platform
   */
  async shareOnPlatform(platform, message) {
    try {
      await exportService.shareOnSocialMedia(platform, {
        message: message,
        url: window.location.href
      })

      // Close modal
      this.currentModal.hide()

      // Show success notification
      appState.actions.showNotification({
        type: 'success',
        title: 'Compartido',
        message: `Se abrió ${platform} para compartir tu mensaje.`
      })

    } catch (error) {
      console.error('Social share failed:', error)
      
      appState.actions.showNotification({
        type: 'error',
        title: 'Error al Compartir',
        message: 'No se pudo abrir la plataforma de redes sociales.'
      })
    }
  }

  /**
   * Get selected memorials
   */
  getSelectedMemorials() {
    const allMemorials = appState.get('memorials') || []
    
    if (this.selectedMemorials.size === 0) {
      return allMemorials // If none selected, use all
    }
    
    return allMemorials.filter(memorial => this.selectedMemorials.has(memorial.id))
  }

  /**
   * Dispose sharing component
   */
  dispose() {
    if (this.currentModal) {
      this.currentModal.hide()
    }
    this.selectedMemorials.clear()
    this.isInitialized = false
    console.log('🧹 Sharing Component disposed')
  }
}
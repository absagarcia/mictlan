/**
 * Memory View - Memory book interface
 * CRUD operations for memorial entries
 */

import { appState } from '../state/AppState.js'
import { router } from '../router/Router.js'
import { i18n } from '../i18n/i18n.js'
import { Navigation } from '../components/ui/Navigation.js'
import { MemoryBookComponent } from '../components/memory/MemoryBookComponent.js'
import { Modal } from '../components/ui/Modal.js'
import { LoadingSpinner } from '../components/ui/LoadingSpinner.js'

export class MemoryView {
  constructor(container) {
    this.container = container
    this.navigation = null
    this.memoryBook = null
    this.currentMemorial = null
  }

  /**
   * Render memory view
   */
  async render() {
    console.log('📖 Rendering Memory View...')

    try {
      this.container.innerHTML = `
        <div class="memory-view">
          <!-- Navigation -->
          <nav id="main-navigation"></nav>
          
          <!-- Main Content -->
          <main id="main-content" class="memory-content">
            <div class="container">
              <!-- Header -->
              <header class="memory-header">
                <div class="header-content">
                  <h1>
                    <span class="header-icon">📖</span>
                    ${i18n.t('memory.title')}
                  </h1>
                  <p class="header-subtitle">${i18n.t('memory.subtitle')}</p>
                </div>
                <div class="header-actions">
                  <button class="btn btn-primary" id="add-memorial-btn">
                    <span>➕</span>
                    ${i18n.t('memory.add_memorial')}
                  </button>
                </div>
              </header>

              <!-- Memory Book Component -->
              <section class="memory-book-section">
                <div id="memory-book-container"></div>
              </section>
            </div>
          </main>
        </div>
      `

      // Initialize navigation
      const navContainer = this.container.querySelector('#main-navigation')
      this.navigation = new Navigation(navContainer)
      await this.navigation.init()

      // Initialize memory book component
      const memoryBookContainer = this.container.querySelector('#memory-book-container')
      this.memoryBook = new MemoryBookComponent(memoryBookContainer)
      await this.memoryBook.init()

      // Setup event listeners
      this.setupEventListeners()

      console.log('✅ Memory View rendered successfully')

    } catch (error) {
      console.error('❌ Failed to render Memory View:', error)
      this.showError(error)
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Add memorial button
    const addMemorialBtn = this.container.querySelector('#add-memorial-btn')
    addMemorialBtn?.addEventListener('click', () => {
      this.showAddMemorialModal()
    })
  }

  /**
   * Show add memorial modal
   */
  showAddMemorialModal() {
    const modal = new Modal({
      title: i18n.t('memory.add_memorial'),
      size: 'large',
      content: this.getAddMemorialForm(),
      onConfirm: () => this.handleAddMemorial(modal),
      onCancel: () => modal.hide()
    })

    modal.show()
  }

  /**
   * Get add memorial form HTML
   */
  getAddMemorialForm() {
    return `
      <form id="add-memorial-form" class="memorial-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="memorial-name">
              ${i18n.t('memory.form.name')} *
            </label>
            <input 
              type="text" 
              id="memorial-name" 
              class="form-input" 
              required
              placeholder="${i18n.t('memory.form.name_placeholder')}"
            >
          </div>
          
          <div class="form-group">
            <label class="form-label" for="memorial-relationship">
              ${i18n.t('memory.form.relationship')} *
            </label>
            <select id="memorial-relationship" class="form-select" required>
              <option value="">${i18n.t('memory.form.select_relationship')}</option>
              <option value="padre">${i18n.t('relationships.father')}</option>
              <option value="madre">${i18n.t('relationships.mother')}</option>
              <option value="abuelo">${i18n.t('relationships.grandfather')}</option>
              <option value="abuela">${i18n.t('relationships.grandmother')}</option>
              <option value="hermano">${i18n.t('relationships.brother')}</option>
              <option value="hermana">${i18n.t('relationships.sister')}</option>
              <option value="tio">${i18n.t('relationships.uncle')}</option>
              <option value="tia">${i18n.t('relationships.aunt')}</option>
              <option value="primo">${i18n.t('relationships.cousin_m')}</option>
              <option value="prima">${i18n.t('relationships.cousin_f')}</option>
              <option value="otro">${i18n.t('relationships.other')}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="memorial-birth-date">
              ${i18n.t('memory.form.birth_date')}
            </label>
            <input 
              type="date" 
              id="memorial-birth-date" 
              class="form-input"
            >
          </div>
          
          <div class="form-group">
            <label class="form-label" for="memorial-death-date">
              ${i18n.t('memory.form.death_date')}
            </label>
            <input 
              type="date" 
              id="memorial-death-date" 
              class="form-input"
            >
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="memorial-photo">
            ${i18n.t('memory.form.photo')}
          </label>
          <input 
            type="file" 
            id="memorial-photo" 
            class="form-input" 
            accept="image/*"
          >
          <small class="form-help">${i18n.t('memory.form.photo_help')}</small>
        </div>

        <div class="form-group">
          <label class="form-label" for="memorial-story">
            ${i18n.t('memory.form.story')}
          </label>
          <textarea 
            id="memorial-story" 
            class="form-textarea" 
            rows="4"
            placeholder="${i18n.t('memory.form.story_placeholder')}"
          ></textarea>
        </div>

        <div class="form-group">
          <label class="form-label" for="memorial-altar-level">
            ${i18n.t('memory.form.altar_level')}
          </label>
          <select id="memorial-altar-level" class="form-select">
            <option value="1">${i18n.t('altar.level1')} - ${i18n.t('altar.level1_desc')}</option>
            <option value="2">${i18n.t('altar.level2')} - ${i18n.t('altar.level2_desc')}</option>
            <option value="3">${i18n.t('altar.level3')} - ${i18n.t('altar.level3_desc')}</option>
          </select>
          <small class="form-help">${i18n.t('memory.form.altar_level_help')}</small>
        </div>
      </form>
    `
  }

  /**
   * Handle add memorial form submission
   */
  async handleAddMemorial(modal) {
    const form = modal.element.querySelector('#add-memorial-form')
    const formData = new FormData(form)
    
    try {
      // Show loading
      const loadingSpinner = LoadingSpinner.show({
        message: i18n.t('memory.saving'),
        container: modal.element.querySelector('.modal-body')
      })

      // Get form values
      const name = form.querySelector('#memorial-name').value.trim()
      const relationship = form.querySelector('#memorial-relationship').value
      const birthDate = form.querySelector('#memorial-birth-date').value
      const deathDate = form.querySelector('#memorial-death-date').value
      const story = form.querySelector('#memorial-story').value.trim()
      const altarLevel = parseInt(form.querySelector('#memorial-altar-level').value)
      const photoFile = form.querySelector('#memorial-photo').files[0]

      // Validate required fields
      if (!name || !relationship) {
        throw new Error(i18n.t('memory.errors.required_fields'))
      }

      // Process photo if provided
      let photoData = null
      if (photoFile) {
        photoData = await this.processPhoto(photoFile)
      }

      // Create memorial object
      const memorial = {
        name,
        relationship,
        birthDate: birthDate ? new Date(birthDate) : null,
        deathDate: deathDate ? new Date(deathDate) : null,
        story,
        altarLevel,
        photo: photoData,
        familyConnections: {
          parents: [],
          children: [],
          spouse: null
        },
        virtualOfferings: {
          position: { x: 0, y: 0, z: 0 },
          items: []
        },
        sharing: {
          isShared: false,
          sharedWith: [],
          shareCode: null,
          permissions: ['view']
        }
      }

      // Add to app state
      const newMemorial = appState.actions.addMemorial(memorial)

      // Hide loading
      loadingSpinner.hide()

      // Show success notification
      appState.actions.showNotification({
        type: 'success',
        title: i18n.t('memory.memorial_added'),
        message: i18n.t('memory.memorial_added_message', { name })
      })

      // Refresh memory book
      if (this.memoryBook) {
        await this.memoryBook.refresh()
      }

      // Close modal
      modal.hide()

      return true

    } catch (error) {
      console.error('Failed to add memorial:', error)
      
      appState.actions.showNotification({
        type: 'error',
        title: i18n.t('memory.errors.add_failed'),
        message: error.message
      })

      return false
    }
  }

  /**
   * Process uploaded photo
   */
  async processPhoto(file) {
    return new Promise((resolve, reject) => {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error(i18n.t('memory.errors.file_too_large')))
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        reject(new Error(i18n.t('memory.errors.invalid_file_type')))
        return
      }

      const reader = new FileReader()
      
      reader.onload = (e) => {
        const img = new Image()
        
        img.onload = () => {
          // Create canvas for resizing
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          // Calculate new dimensions (max 800px width)
          const maxWidth = 800
          const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
          canvas.width = img.width * ratio
          canvas.height = img.height * ratio
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          
          // Convert to base64 with compression
          const compressedData = canvas.toDataURL('image/jpeg', 0.8)
          resolve(compressedData)
        }
        
        img.onerror = () => reject(new Error(i18n.t('memory.errors.image_processing')))
        img.src = e.target.result
      }
      
      reader.onerror = () => reject(new Error(i18n.t('memory.errors.file_read')))
      reader.readAsDataURL(file)
    })
  }

  /**
   * Show error state
   */
  showError(error) {
    this.container.innerHTML = `
      <div class="memory-error">
        <div class="container">
          <h2>😔 ${i18n.t('errors.memory_load_failed')}</h2>
          <p>${i18n.t('errors.try_again')}</p>
          <details>
            <summary>${i18n.t('errors.technical_details')}</summary>
            <pre>${error.message}\n${error.stack}</pre>
          </details>
          <button class="btn btn-primary" onclick="window.location.reload()">
            ${i18n.t('actions.reload')}
          </button>
        </div>
      </div>
    `
  }

  /**
   * Dispose view and cleanup
   */
  dispose() {
    if (this.navigation) {
      this.navigation.dispose()
    }
    if (this.memoryBook) {
      this.memoryBook.dispose()
    }
    console.log('🧹 Memory View disposed')
  }
}
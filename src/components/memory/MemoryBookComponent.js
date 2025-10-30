/**
 * Mictla Memory Book Component
 * Handles CRUD operations for memorial entries with photo upload and audio recording
 */

import { Memorial } from '../../types/index.js'
import { storageManager } from '../../services/StorageManager.js'
import { validationService } from '../../services/ValidationService.js'
import { appState } from '../../state/AppState.js'
import MCPService from '../../services/MCPService.js'

export class MemoryBookComponent {
  constructor(container) {
    this.container = container
    this.currentMemorial = null
    this.isEditing = false
    this.mediaRecorder = null
    this.audioChunks = []
    
    // Initialize storage
    this.initializeStorage()
    
    // Bind methods
    this.handleFormSubmit = this.handleFormSubmit.bind(this)
    this.handlePhotoUpload = this.handlePhotoUpload.bind(this)
    this.handleAudioRecord = this.handleAudioRecord.bind(this)
    this.handleAudioStop = this.handleAudioStop.bind(this)
    
    // Initialize component
    this.init()
  }

  async initializeStorage() {
    try {
      await storageManager.init()
      // Initialize MCP services
      await MCPService.initialize()
    } catch (error) {
      console.error('Failed to initialize storage:', error)
      this.showError('Failed to initialize storage. Some features may not work.')
    }
  }

  init() {
    this.render()
    this.attachEventListeners()
    this.loadMemorials()
  }

  render() {
    this.container.innerHTML = `
      <div class="memory-book">
        <header class="memory-book-header">
          <h2>Libro de Memorias</h2>
          <button class="btn-primary" id="add-memorial-btn">
            <span class="icon">+</span>
            Agregar Memoria
          </button>
        </header>
        
        <div class="memory-book-content">
          <!-- Memorial Form (initially hidden) -->
          <div class="memorial-form-container" id="memorial-form-container" style="display: none;">
            <form class="memorial-form" id="memorial-form">
              <div class="form-header">
                <h3 id="form-title">Nueva Memoria</h3>
                <button type="button" class="btn-close" id="close-form-btn">&times;</button>
              </div>
              
              <div class="form-grid">
                <div class="form-group">
                  <label for="memorial-name">Nombre *</label>
                  <input type="text" id="memorial-name" name="name" required maxlength="100">
                  <div class="field-error" id="name-error"></div>
                </div>
                
                <div class="form-group">
                  <label for="memorial-relationship">Relación</label>
                  <select id="memorial-relationship" name="relationship">
                    <option value="">Seleccionar...</option>
                    <option value="padre">Padre</option>
                    <option value="madre">Madre</option>
                    <option value="abuelo">Abuelo</option>
                    <option value="abuela">Abuela</option>
                    <option value="hermano">Hermano</option>
                    <option value="hermana">Hermana</option>
                    <option value="tio">Tío</option>
                    <option value="tia">Tía</option>
                    <option value="primo">Primo</option>
                    <option value="prima">Prima</option>
                    <option value="esposo">Esposo</option>
                    <option value="esposa">Esposa</option>
                    <option value="hijo">Hijo</option>
                    <option value="hija">Hija</option>
                    <option value="amigo">Amigo</option>
                    <option value="amiga">Amiga</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                
                <div class="form-group">
                  <label for="memorial-birth-date">Fecha de Nacimiento</label>
                  <input type="date" id="memorial-birth-date" name="birthDate">
                  <div class="field-error" id="birthDate-error"></div>
                </div>
                
                <div class="form-group">
                  <label for="memorial-death-date">Fecha de Fallecimiento</label>
                  <input type="date" id="memorial-death-date" name="deathDate">
                  <div class="field-error" id="deathDate-error"></div>
                </div>
                
                <div class="form-group">
                  <label for="memorial-altar-level">Nivel del Altar</label>
                  <select id="memorial-altar-level" name="altarLevel">
                    <option value="1">Nivel 1 - Terrenal</option>
                    <option value="2">Nivel 2 - Purgatorio</option>
                    <option value="3">Nivel 3 - Celestial</option>
                  </select>
                </div>
                
                <div class="form-group full-width">
                  <label for="memorial-photo">Fotografía</label>
                  <div class="photo-upload">
                    <input type="file" id="memorial-photo" name="photo" accept="image/*">
                    <div class="photo-preview" id="photo-preview"></div>
                    <div class="field-error" id="photo-error"></div>
                  </div>
                </div>
                
                <div class="form-group full-width">
                  <label for="memorial-story">Historia y Recuerdos</label>
                  <textarea id="memorial-story" name="story" rows="4" maxlength="5000" 
                    placeholder="Comparte los recuerdos especiales de esta persona querida..."></textarea>
                  <div class="character-count">
                    <span id="story-count">0</span>/5000 caracteres
                  </div>
                  <div class="field-error" id="story-error"></div>
                </div>
                
                <div class="form-group full-width">
                  <label>Mensaje de Voz</label>
                  <div class="audio-recorder">
                    <button type="button" class="btn-record" id="record-btn">
                      <span class="icon">🎤</span>
                      Grabar Mensaje
                    </button>
                    <button type="button" class="btn-stop" id="stop-btn" style="display: none;">
                      <span class="icon">⏹</span>
                      Detener
                    </button>
                    <div class="audio-preview" id="audio-preview"></div>
                    <div class="field-error" id="audio-error"></div>
                  </div>
                </div>
              </div>
              
              <div class="form-actions">
                <button type="button" class="btn-secondary" id="cancel-btn">Cancelar</button>
                <button type="submit" class="btn-primary" id="save-btn">
                  <span class="loading-spinner" style="display: none;"></span>
                  Guardar Memoria
                </button>
              </div>
            </form>
          </div>
          
          <!-- Memorial Gallery -->
          <div class="memorial-gallery" id="memorial-gallery">
            <div class="loading-state" id="loading-state">
              <div class="spinner"></div>
              <p>Cargando memorias...</p>
            </div>
            
            <div class="empty-state" id="empty-state" style="display: none;">
              <div class="empty-icon">📖</div>
              <h3>Tu libro de memorias está vacío</h3>
              <p>Comienza agregando la primera memoria de un ser querido</p>
              <button class="btn-primary" id="empty-add-btn">Agregar Primera Memoria</button>
            </div>
            
            <div class="memorial-grid" id="memorial-grid"></div>
          </div>
        </div>
        
        <!-- Error/Success Messages -->
        <div class="message-container" id="message-container"></div>
      </div>
    `
  }

  attachEventListeners() {
    // Form toggle buttons
    document.getElementById('add-memorial-btn').addEventListener('click', () => this.showForm())
    document.getElementById('empty-add-btn').addEventListener('click', () => this.showForm())
    document.getElementById('close-form-btn').addEventListener('click', () => this.hideForm())
    document.getElementById('cancel-btn').addEventListener('click', () => this.hideForm())
    
    // Form submission
    document.getElementById('memorial-form').addEventListener('submit', this.handleFormSubmit)
    
    // Photo upload
    document.getElementById('memorial-photo').addEventListener('change', this.handlePhotoUpload)
    
    // Audio recording
    document.getElementById('record-btn').addEventListener('click', this.handleAudioRecord)
    document.getElementById('stop-btn').addEventListener('click', this.handleAudioStop)
    
    // Story character count
    document.getElementById('memorial-story').addEventListener('input', this.updateCharacterCount)
    
    // Form validation on input
    this.attachValidationListeners()
  }

  attachValidationListeners() {
    const fields = ['name', 'birthDate', 'deathDate', 'story']
    fields.forEach(field => {
      const element = document.getElementById(`memorial-${field}`)
      if (element) {
        element.addEventListener('blur', () => this.validateField(field))
        element.addEventListener('input', () => this.clearFieldError(field))
      }
    })
  }

  async loadMemorials() {
    try {
      this.showLoading(true)
      const memorials = await storageManager.getMemorials()
      this.displayMemorials(memorials)
      
      // Update app state
      appState.set('memorials', memorials.map(m => m.toJSON()))
      
    } catch (error) {
      console.error('Failed to load memorials:', error)
      this.showError('Error al cargar las memorias')
    } finally {
      this.showLoading(false)
    }
  }

  displayMemorials(memorials) {
    const gallery = document.getElementById('memorial-gallery')
    const grid = document.getElementById('memorial-grid')
    const emptyState = document.getElementById('empty-state')
    
    if (memorials.length === 0) {
      emptyState.style.display = 'block'
      grid.style.display = 'none'
    } else {
      emptyState.style.display = 'none'
      grid.style.display = 'grid'
      
      grid.innerHTML = memorials.map(memorial => this.createMemorialCard(memorial)).join('')
      
      // Attach card event listeners
      this.attachCardEventListeners()
    }
  }

  createMemorialCard(memorial) {
    const birthYear = memorial.birthDate ? new Date(memorial.birthDate).getFullYear() : '?'
    const deathYear = memorial.deathDate ? new Date(memorial.deathDate).getFullYear() : '?'
    const photoSrc = memorial.photo || '/assets/default-memorial.jpg'
    const hasAudio = memorial.audioMessage ? 'has-audio' : ''
    
    return `
      <div class="memorial-card ${hasAudio}" data-memorial-id="${memorial.id}">
        <div class="memorial-photo">
          <img src="${photoSrc}" alt="${memorial.name}" loading="lazy">
          ${memorial.audioMessage ? '<div class="audio-indicator">🎵</div>' : ''}
        </div>
        
        <div class="memorial-info">
          <h3 class="memorial-name">${memorial.name}</h3>
          <p class="memorial-relationship">${memorial.relationship || 'Ser querido'}</p>
          <p class="memorial-dates">${birthYear} - ${deathYear}</p>
          
          ${memorial.story ? `
            <p class="memorial-story-preview">
              ${memorial.story.substring(0, 100)}${memorial.story.length > 100 ? '...' : ''}
            </p>
          ` : ''}
          
          <div class="memorial-level">
            <span class="level-badge level-${memorial.altarLevel}">
              Nivel ${memorial.altarLevel}
            </span>
          </div>
        </div>
        
        <div class="memorial-actions">
          <button class="btn-icon view-btn" data-action="view" title="Ver detalles">
            <span class="icon">👁</span>
          </button>
          <button class="btn-icon edit-btn" data-action="edit" title="Editar">
            <span class="icon">✏️</span>
          </button>
          <button class="btn-icon delete-btn" data-action="delete" title="Eliminar">
            <span class="icon">🗑</span>
          </button>
        </div>
      </div>
    `
  }

  attachCardEventListeners() {
    const cards = document.querySelectorAll('.memorial-card')
    cards.forEach(card => {
      const memorialId = card.dataset.memorialId
      
      // View action
      card.querySelector('.view-btn').addEventListener('click', (e) => {
        e.stopPropagation()
        this.viewMemorial(memorialId)
      })
      
      // Edit action
      card.querySelector('.edit-btn').addEventListener('click', (e) => {
        e.stopPropagation()
        this.editMemorial(memorialId)
      })
      
      // Delete action
      card.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation()
        this.deleteMemorial(memorialId)
      })
      
      // Card click to view
      card.addEventListener('click', () => this.viewMemorial(memorialId))
    })
  }

  showForm(memorial = null) {
    this.currentMemorial = memorial
    this.isEditing = !!memorial
    
    const container = document.getElementById('memorial-form-container')
    const title = document.getElementById('form-title')
    const form = document.getElementById('memorial-form')
    
    title.textContent = this.isEditing ? 'Editar Memoria' : 'Nueva Memoria'
    container.style.display = 'block'
    
    if (memorial) {
      this.populateForm(memorial)
    } else {
      form.reset()
      this.clearAllErrors()
      this.clearPreviews()
    }
    
    // Focus first field
    document.getElementById('memorial-name').focus()
  }

  hideForm() {
    document.getElementById('memorial-form-container').style.display = 'none'
    document.getElementById('memorial-form').reset()
    this.clearAllErrors()
    this.clearPreviews()
    this.currentMemorial = null
    this.isEditing = false
  }

  populateForm(memorial) {
    document.getElementById('memorial-name').value = memorial.name || ''
    document.getElementById('memorial-relationship').value = memorial.relationship || ''
    document.getElementById('memorial-birth-date').value = memorial.birthDate ? 
      memorial.birthDate.toISOString().split('T')[0] : ''
    document.getElementById('memorial-death-date').value = memorial.deathDate ? 
      memorial.deathDate.toISOString().split('T')[0] : ''
    document.getElementById('memorial-altar-level').value = memorial.altarLevel || 1
    document.getElementById('memorial-story').value = memorial.story || ''
    
    // Update character count
    this.updateCharacterCount()
    
    // Show photo preview if exists
    if (memorial.photo) {
      this.showPhotoPreview(memorial.photo)
    }
    
    // Show audio preview if exists
    if (memorial.audioMessage) {
      this.showAudioPreview(memorial.audioMessage)
    }
  }

  async handleFormSubmit(event) {
    event.preventDefault()
    
    const saveBtn = document.getElementById('save-btn')
    const spinner = saveBtn.querySelector('.loading-spinner')
    
    try {
      // Show loading state
      saveBtn.disabled = true
      spinner.style.display = 'inline-block'
      
      // Collect form data
      const formData = new FormData(event.target)
      const memorialData = {
        name: formData.get('name'),
        relationship: formData.get('relationship'),
        birthDate: formData.get('birthDate'),
        deathDate: formData.get('deathDate'),
        altarLevel: parseInt(formData.get('altarLevel')),
        story: formData.get('story')
      }
      
      // Add existing data if editing
      if (this.isEditing && this.currentMemorial) {
        memorialData.id = this.currentMemorial.id
        memorialData.photo = this.currentMemorial.photo
        memorialData.audioMessage = this.currentMemorial.audioMessage
        memorialData.createdAt = this.currentMemorial.createdAt
      }
      
      // Get photo from preview if changed
      const photoPreview = document.getElementById('photo-preview')
      if (photoPreview.dataset.photoData) {
        memorialData.photo = photoPreview.dataset.photoData
      }
      
      // Get audio from preview if changed
      const audioPreview = document.getElementById('audio-preview')
      if (audioPreview.dataset.audioData) {
        memorialData.audioMessage = audioPreview.dataset.audioData
      }
      
      // Validate data
      const validation = validationService.validateMemorial(memorialData)
      if (!validation.isValid) {
        this.showValidationErrors(validation.errors)
        return
      }

      // Cultural validation using MCP
      if (memorialData.story) {
        const culturalValidation = await MCPService.validateTradition(memorialData.story, 'memorial')
        if (!culturalValidation.isValid) {
          this.showFieldError('story', 'El contenido no es culturalmente apropiado. ' + 
            (culturalValidation.suggestions.length > 0 ? culturalValidation.suggestions[0] : ''))
          return
        }
      }
      
      // Save memorial
      const memorial = await storageManager.saveMemorial(validation.sanitized)
      
      // Update UI
      await this.loadMemorials()
      this.hideForm()
      this.showSuccess(this.isEditing ? 'Memoria actualizada exitosamente' : 'Memoria guardada exitosamente')
      
      // Update app state
      if (this.isEditing) {
        appState.actions.updateMemorial(memorial.id, memorial.toJSON())
      } else {
        appState.actions.addMemorial(memorial.toJSON())
      }
      
    } catch (error) {
      console.error('Failed to save memorial:', error)
      this.showError('Error al guardar la memoria: ' + error.message)
    } finally {
      saveBtn.disabled = false
      spinner.style.display = 'none'
    }
  }

  async handlePhotoUpload(event) {
    const file = event.target.files[0]
    if (!file) return
    
    try {
      // Validate file
      const validation = validationService.validateImageFile(file)
      if (!validation.isValid) {
        this.showFieldError('photo', validation.errors.join(', '))
        return
      }
      
      // Compress and convert to base64
      const compressedPhoto = await this.compressImage(file)
      this.showPhotoPreview(compressedPhoto)
      this.clearFieldError('photo')
      
    } catch (error) {
      console.error('Photo upload error:', error)
      this.showFieldError('photo', 'Error al procesar la imagen')
    }
  }

  async compressImage(file, maxWidth = 800, quality = 0.8) {
    try {
      // First convert file to data URL
      const dataUrl = await this.fileToDataUrl(file)
      
      // Use MCP service for image compression
      const compressedImage = await MCPService.compressImage(dataUrl, quality, maxWidth, maxWidth)
      return compressedImage
    } catch (error) {
      console.warn('MCP image compression failed, using fallback:', error)
      // Fallback to canvas compression
      return this.fallbackCompressImage(file, maxWidth, quality)
    }
  }

  async fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async fallbackCompressImage(file, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        // Set canvas size
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      }
      
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  showPhotoPreview(photoData) {
    const preview = document.getElementById('photo-preview')
    preview.innerHTML = `
      <div class="photo-preview-container">
        <img src="${photoData}" alt="Vista previa">
        <button type="button" class="btn-remove-photo" onclick="this.parentElement.parentElement.innerHTML=''; this.parentElement.parentElement.dataset.photoData='';">
          &times;
        </button>
      </div>
    `
    preview.dataset.photoData = photoData
  }

  async handleAudioRecord() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.mediaRecorder = new MediaRecorder(stream)
      this.audioChunks = []
      
      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data)
      }
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' })
        this.convertAudioToBase64(audioBlob)
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      this.mediaRecorder.start()
      
      // Update UI
      document.getElementById('record-btn').style.display = 'none'
      document.getElementById('stop-btn').style.display = 'inline-block'
      
    } catch (error) {
      console.error('Audio recording error:', error)
      this.showFieldError('audio', 'Error al acceder al micrófono')
    }
  }

  handleAudioStop() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop()
    }
    
    // Update UI
    document.getElementById('record-btn').style.display = 'inline-block'
    document.getElementById('stop-btn').style.display = 'none'
  }

  async convertAudioToBase64(audioBlob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const audioData = reader.result
        this.showAudioPreview(audioData)
        resolve(audioData)
      }
      reader.onerror = reject
      reader.readAsDataURL(audioBlob)
    })
  }

  showAudioPreview(audioData) {
    const preview = document.getElementById('audio-preview')
    preview.innerHTML = `
      <div class="audio-preview-container">
        <audio controls>
          <source src="${audioData}" type="audio/webm">
          Tu navegador no soporta el elemento de audio.
        </audio>
        <button type="button" class="btn-remove-audio" onclick="this.parentElement.parentElement.innerHTML=''; this.parentElement.parentElement.dataset.audioData='';">
          Eliminar
        </button>
      </div>
    `
    preview.dataset.audioData = audioData
  }

  updateCharacterCount() {
    const textarea = document.getElementById('memorial-story')
    const counter = document.getElementById('story-count')
    counter.textContent = textarea.value.length
  }

  async viewMemorial(memorialId) {
    try {
      const memorial = await storageManager.getMemorial(memorialId)
      if (memorial) {
        this.showMemorialModal(memorial)
      }
    } catch (error) {
      console.error('Failed to load memorial:', error)
      this.showError('Error al cargar la memoria')
    }
  }

  async editMemorial(memorialId) {
    try {
      const memorial = await storageManager.getMemorial(memorialId)
      if (memorial) {
        this.showForm(memorial)
      }
    } catch (error) {
      console.error('Failed to load memorial for editing:', error)
      this.showError('Error al cargar la memoria para editar')
    }
  }

  async deleteMemorial(memorialId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta memoria? Esta acción no se puede deshacer.')) {
      return
    }
    
    try {
      const success = await storageManager.deleteMemorial(memorialId)
      if (success) {
        await this.loadMemorials()
        this.showSuccess('Memoria eliminada exitosamente')
        
        // Update app state
        appState.actions.removeMemorial(memorialId)
      } else {
        this.showError('Error al eliminar la memoria')
      }
    } catch (error) {
      console.error('Failed to delete memorial:', error)
      this.showError('Error al eliminar la memoria')
    }
  }

  showMemorialModal(memorial) {
    // Create modal HTML
    const modalHtml = `
      <div class="modal-overlay" id="memorial-modal">
        <div class="modal-content memorial-modal">
          <div class="modal-header">
            <h2>${memorial.name}</h2>
            <button class="btn-close" onclick="document.getElementById('memorial-modal').remove()">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="memorial-details">
              ${memorial.photo ? `
                <div class="memorial-photo-large">
                  <img src="${memorial.photo}" alt="${memorial.name}">
                </div>
              ` : ''}
              
              <div class="memorial-info-detailed">
                <div class="info-grid">
                  <div class="info-item">
                    <label>Relación:</label>
                    <span>${memorial.relationship || 'No especificada'}</span>
                  </div>
                  
                  ${memorial.birthDate ? `
                    <div class="info-item">
                      <label>Nacimiento:</label>
                      <span>${memorial.birthDate.toLocaleDateString()}</span>
                    </div>
                  ` : ''}
                  
                  ${memorial.deathDate ? `
                    <div class="info-item">
                      <label>Fallecimiento:</label>
                      <span>${memorial.deathDate.toLocaleDateString()}</span>
                    </div>
                  ` : ''}
                  
                  <div class="info-item">
                    <label>Nivel del Altar:</label>
                    <span class="level-badge level-${memorial.altarLevel}">Nivel ${memorial.altarLevel}</span>
                  </div>
                </div>
                
                ${memorial.story ? `
                  <div class="memorial-story-full">
                    <h3>Historia y Recuerdos</h3>
                    <p>${memorial.story}</p>
                  </div>
                ` : ''}
                
                ${memorial.audioMessage ? `
                  <div class="memorial-audio">
                    <h3>Mensaje de Voz</h3>
                    <audio controls>
                      <source src="${memorial.audioMessage}" type="audio/webm">
                      Tu navegador no soporta el elemento de audio.
                    </audio>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn-secondary" onclick="document.getElementById('memorial-modal').remove()">Cerrar</button>
            <button class="btn-primary" onclick="document.getElementById('memorial-modal').remove(); this.editMemorial('${memorial.id}')">Editar</button>
          </div>
        </div>
      </div>
    `
    
    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml)
  }

  // Validation and error handling methods
  validateField(fieldName) {
    const element = document.getElementById(`memorial-${fieldName}`)
    const value = element.value
    
    let isValid = true
    let errorMessage = ''
    
    switch (fieldName) {
      case 'name':
        if (!value.trim()) {
          isValid = false
          errorMessage = 'El nombre es requerido'
        } else if (value.length > 100) {
          isValid = false
          errorMessage = 'El nombre debe tener menos de 100 caracteres'
        }
        break
        
      case 'birthDate':
        if (value && new Date(value) > new Date()) {
          isValid = false
          errorMessage = 'La fecha de nacimiento no puede ser futura'
        }
        break
        
      case 'deathDate':
        if (value && new Date(value) > new Date()) {
          isValid = false
          errorMessage = 'La fecha de fallecimiento no puede ser futura'
        }
        break
        
      case 'story':
        if (value.length > 5000) {
          isValid = false
          errorMessage = 'La historia debe tener menos de 5000 caracteres'
        }
        break
    }
    
    if (!isValid) {
      this.showFieldError(fieldName, errorMessage)
    } else {
      this.clearFieldError(fieldName)
    }
    
    return isValid
  }

  showFieldError(fieldName, message) {
    const errorElement = document.getElementById(`${fieldName}-error`)
    if (errorElement) {
      errorElement.textContent = message
      errorElement.style.display = 'block'
    }
  }

  clearFieldError(fieldName) {
    const errorElement = document.getElementById(`${fieldName}-error`)
    if (errorElement) {
      errorElement.textContent = ''
      errorElement.style.display = 'none'
    }
  }

  clearAllErrors() {
    const errorElements = document.querySelectorAll('.field-error')
    errorElements.forEach(element => {
      element.textContent = ''
      element.style.display = 'none'
    })
  }

  showValidationErrors(errors) {
    errors.forEach(error => {
      // Try to map error to specific field
      if (error.includes('Name')) {
        this.showFieldError('name', error)
      } else if (error.includes('birth date') || error.includes('Birth date')) {
        this.showFieldError('birthDate', error)
      } else if (error.includes('death date') || error.includes('Death date')) {
        this.showFieldError('deathDate', error)
      } else if (error.includes('Story')) {
        this.showFieldError('story', error)
      } else {
        this.showError(error)
      }
    })
  }

  clearPreviews() {
    document.getElementById('photo-preview').innerHTML = ''
    document.getElementById('photo-preview').dataset.photoData = ''
    document.getElementById('audio-preview').innerHTML = ''
    document.getElementById('audio-preview').dataset.audioData = ''
  }

  showLoading(show) {
    const loadingState = document.getElementById('loading-state')
    const gallery = document.getElementById('memorial-gallery')
    
    if (show) {
      loadingState.style.display = 'block'
    } else {
      loadingState.style.display = 'none'
    }
  }

  showError(message) {
    this.showMessage(message, 'error')
  }

  showSuccess(message) {
    this.showMessage(message, 'success')
  }

  showMessage(message, type) {
    const container = document.getElementById('message-container')
    const messageId = 'message-' + Date.now()
    
    const messageHtml = `
      <div class="message ${type}" id="${messageId}">
        <span class="message-text">${message}</span>
        <button class="message-close" onclick="document.getElementById('${messageId}').remove()">&times;</button>
      </div>
    `
    
    container.insertAdjacentHTML('beforeend', messageHtml)
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      const messageElement = document.getElementById(messageId)
      if (messageElement) {
        messageElement.remove()
      }
    }, 5000)
  }

  // Public API methods
  async getMemorials() {
    return await storageManager.getMemorials()
  }

  async getMemorialsByLevel(level) {
    return await storageManager.getMemorialsByLevel(level)
  }

  async exportMemorials() {
    try {
      const data = await storageManager.exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `mictla-memorias-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      this.showSuccess('Memorias exportadas exitosamente')
    } catch (error) {
      console.error('Export failed:', error)
      this.showError('Error al exportar las memorias')
    }
  }

  destroy() {
    // Clean up event listeners and resources
    if (this.mediaRecorder) {
      this.mediaRecorder.stop()
    }
    
    // Remove any modals
    const modal = document.getElementById('memorial-modal')
    if (modal) {
      modal.remove()
    }
  }
}
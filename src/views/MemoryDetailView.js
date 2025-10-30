/**
 * Memory Detail View - Individual memorial details
 * Detailed view of a specific memorial entry
 */

import { appState } from '../state/AppState.js'
import { router } from '../router/Router.js'
import { i18n } from '../i18n/i18n.js'
import { Navigation } from '../components/ui/Navigation.js'
import { Modal } from '../components/ui/Modal.js'

export class MemoryDetailView {
  constructor(container, memorialId) {
    this.container = container
    this.memorialId = memorialId
    this.navigation = null
    this.memorial = null
  }

  /**
   * Render memory detail view
   */
  async render() {
    console.log(`📖 Rendering Memory Detail View for memorial: ${this.memorialId}`)

    try {
      // Find the memorial
      const memorials = appState.get('memorials') || []
      this.memorial = memorials.find(m => m.id === this.memorialId)

      if (!this.memorial) {
        this.showNotFound()
        return
      }

      this.container.innerHTML = `
        <div class="memory-detail-view">
          <!-- Navigation -->
          <nav id="main-navigation"></nav>
          
          <!-- Main Content -->
          <main id="main-content" class="memory-detail-content">
            <div class="container">
              <!-- Header -->
              <header class="memory-detail-header">
                <div class="header-navigation">
                  <button class="btn btn-ghost" id="back-btn">
                    <span>⬅️</span>
                    ${i18n.t('actions.back_to_memories')}
                  </button>
                </div>
                
                <div class="header-actions">
                  <button class="btn btn-outline" id="edit-memorial-btn">
                    <span>✏️</span>
                    ${i18n.t('actions.edit')}
                  </button>
                  
                  <button class="btn btn-outline" id="share-memorial-btn">
                    <span>📤</span>
                    ${i18n.t('actions.share')}
                  </button>
                  
                  <button class="btn btn-primary" id="view-in-ar-btn">
                    <span>🥽</span>
                    ${i18n.t('actions.view_in_ar')}
                  </button>
                </div>
              </header>

              <!-- Memorial Content -->
              <div class="memorial-detail-content">
                <!-- Main Info -->
                <section class="memorial-main-info">
                  <div class="memorial-photo-section">
                    ${this.memorial.photo ? `
                      <img 
                        src="${this.memorial.photo}" 
                        alt="${this.memorial.name}"
                        class="memorial-photo-large"
                      >
                    ` : `
                      <div class="memorial-photo-placeholder-large">
                        <span class="placeholder-icon">👤</span>
                        <p>${i18n.t('memory.no_photo')}</p>
                      </div>
                    `}
                  </div>
                  
                  <div class="memorial-info-section">
                    <h1 class="memorial-name">${this.memorial.name}</h1>
                    
                    <div class="memorial-metadata">
                      <div class="metadata-item">
                        <span class="metadata-label">${i18n.t('memory.relationship')}</span>
                        <span class="metadata-value">${i18n.t('relationships.' + this.memorial.relationship)}</span>
                      </div>
                      
                      ${this.memorial.birthDate ? `
                        <div class="metadata-item">
                          <span class="metadata-label">${i18n.t('memory.birth_date')}</span>
                          <span class="metadata-value">${new Date(this.memorial.birthDate).toLocaleDateString()}</span>
                        </div>
                      ` : ''}
                      
                      ${this.memorial.deathDate ? `
                        <div class="metadata-item">
                          <span class="metadata-label">${i18n.t('memory.death_date')}</span>
                          <span class="metadata-value">${new Date(this.memorial.deathDate).toLocaleDateString()}</span>
                        </div>
                      ` : ''}
                      
                      <div class="metadata-item">
                        <span class="metadata-label">${i18n.t('memory.altar_level')}</span>
                        <span class="metadata-value">
                          ${i18n.t('altar.level' + this.memorial.altarLevel)} - 
                          ${i18n.t('altar.level' + this.memorial.altarLevel + '_desc')}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                <!-- Story Section -->
                ${this.memorial.story ? `
                  <section class="memorial-story-section">
                    <h2>${i18n.t('memory.story')}</h2>
                    <div class="story-content">
                      <p>${this.memorial.story}</p>
                    </div>
                  </section>
                ` : ''}

                <!-- Audio Section -->
                ${this.memorial.audioMessage ? `
                  <section class="memorial-audio-section">
                    <h2>${i18n.t('memory.audio_message')}</h2>
                    <div class="audio-content">
                      <audio controls>
                        <source src="${this.memorial.audioMessage}" type="audio/mpeg">
                        ${i18n.t('memory.audio_not_supported')}
                      </audio>
                    </div>
                  </section>
                ` : ''}

                <!-- Family Connections -->
                ${this.hasConnections() ? `
                  <section class="family-connections-section">
                    <h2>${i18n.t('memory.family_connections')}</h2>
                    <div class="connections-content">
                      ${this.renderConnections()}
                    </div>
                  </section>
                ` : ''}

                <!-- Virtual Offerings -->
                <section class="virtual-offerings-section">
                  <h2>${i18n.t('memory.virtual_offerings')}</h2>
                  <div class="offerings-content">
                    ${this.renderOfferings()}
                  </div>
                </section>

                <!-- Sharing Info -->
                ${this.memorial.sharing?.isShared ? `
                  <section class="sharing-info-section">
                    <h2>${i18n.t('memory.sharing_info')}</h2>
                    <div class="sharing-content">
                      ${this.renderSharingInfo()}
                    </div>
                  </section>
                ` : ''}

                <!-- Timeline -->
                <section class="memorial-timeline-section">
                  <h2>${i18n.t('memory.timeline')}</h2>
                  <div class="timeline-content">
                    ${this.renderTimeline()}
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      `

      // Initialize navigation
      const navContainer = this.container.querySelector('#main-navigation')
      this.navigation = new Navigation(navContainer)
      await this.navigation.init()

      // Setup event listeners
      this.setupEventListeners()

      console.log('✅ Memory Detail View rendered successfully')

    } catch (error) {
      console.error('❌ Failed to render Memory Detail View:', error)
      this.showError(error)
    }
  }

  /**
   * Check if memorial has family connections
   */
  hasConnections() {
    const connections = this.memorial.familyConnections
    return connections && (
      connections.parents?.length > 0 ||
      connections.children?.length > 0 ||
      connections.spouse
    )
  }

  /**
   * Render family connections
   */
  renderConnections() {
    const connections = this.memorial.familyConnections
    const memorials = appState.get('memorials') || []
    let html = ''

    if (connections.parents?.length > 0) {
      html += `
        <div class="connection-group">
          <h4>${i18n.t('memory.connections.parents')}</h4>
          <div class="connection-list">
            ${connections.parents.map(parentId => {
              const parent = memorials.find(m => m.id === parentId)
              return parent ? `
                <button class="connection-link" data-memorial-id="${parent.id}">
                  ${parent.name}
                </button>
              ` : ''
            }).join('')}
          </div>
        </div>
      `
    }

    if (connections.spouse) {
      const spouse = memorials.find(m => m.id === connections.spouse)
      if (spouse) {
        html += `
          <div class="connection-group">
            <h4>${i18n.t('memory.connections.spouse')}</h4>
            <div class="connection-list">
              <button class="connection-link" data-memorial-id="${spouse.id}">
                ${spouse.name}
              </button>
            </div>
          </div>
        `
      }
    }

    if (connections.children?.length > 0) {
      html += `
        <div class="connection-group">
          <h4>${i18n.t('memory.connections.children')}</h4>
          <div class="connection-list">
            ${connections.children.map(childId => {
              const child = memorials.find(m => m.id === childId)
              return child ? `
                <button class="connection-link" data-memorial-id="${child.id}">
                  ${child.name}
                </button>
              ` : ''
            }).join('')}
          </div>
        </div>
      `
    }

    return html || `<p>${i18n.t('memory.no_connections')}</p>`
  }

  /**
   * Render virtual offerings
   */
  renderOfferings() {
    const offerings = this.memorial.virtualOfferings?.items || []
    
    if (offerings.length === 0) {
      return `
        <div class="no-offerings">
          <p>${i18n.t('memory.no_offerings')}</p>
          <button class="btn btn-outline" id="add-offering-btn">
            <span>➕</span>
            ${i18n.t('memory.add_offering')}
          </button>
        </div>
      `
    }

    return `
      <div class="offerings-list">
        ${offerings.map(offering => `
          <div class="offering-item">
            <span class="offering-icon">${this.getOfferingIcon(offering)}</span>
            <span class="offering-name">${i18n.t('offerings.' + offering)}</span>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-outline" id="add-offering-btn">
        <span>➕</span>
        ${i18n.t('memory.add_offering')}
      </button>
    `
  }

  /**
   * Get offering icon
   */
  getOfferingIcon(offering) {
    const icons = {
      cempasuchil: '🌼',
      pan_de_muerto: '🍞',
      agua: '💧',
      sal: '🧂',
      foto: '📷',
      vela: '🕯️',
      incienso: '🔥',
      comida: '🍽️'
    }
    return icons[offering] || '🎁'
  }

  /**
   * Render sharing info
   */
  renderSharingInfo() {
    const sharing = this.memorial.sharing
    
    return `
      <div class="sharing-details">
        <div class="sharing-status">
          <span class="status-icon">✅</span>
          <span class="status-text">${i18n.t('memory.shared_with_family')}</span>
        </div>
        
        ${sharing.sharedWith?.length > 0 ? `
          <div class="shared-with">
            <h4>${i18n.t('memory.shared_with')}</h4>
            <ul>
              ${sharing.sharedWith.map(email => `
                <li>${email}</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${sharing.shareCode ? `
          <div class="share-code">
            <h4>${i18n.t('memory.share_code')}</h4>
            <code>${sharing.shareCode}</code>
          </div>
        ` : ''}
      </div>
    `
  }

  /**
   * Render timeline
   */
  renderTimeline() {
    const events = []
    
    // Add creation event
    events.push({
      date: this.memorial.createdAt,
      type: 'created',
      message: i18n.t('memory.timeline.created')
    })
    
    // Add update event if different from creation
    if (this.memorial.updatedAt && 
        new Date(this.memorial.updatedAt).getTime() !== new Date(this.memorial.createdAt).getTime()) {
      events.push({
        date: this.memorial.updatedAt,
        type: 'updated',
        message: i18n.t('memory.timeline.updated')
      })
    }
    
    // Add sharing event if shared
    if (this.memorial.sharing?.isShared) {
      events.push({
        date: this.memorial.updatedAt, // Approximate
        type: 'shared',
        message: i18n.t('memory.timeline.shared')
      })
    }
    
    // Sort by date
    events.sort((a, b) => new Date(b.date) - new Date(a.date))
    
    return `
      <div class="timeline">
        ${events.map(event => `
          <div class="timeline-item">
            <div class="timeline-icon ${event.type}">
              ${this.getTimelineIcon(event.type)}
            </div>
            <div class="timeline-content">
              <p class="timeline-message">${event.message}</p>
              <time class="timeline-date">${new Date(event.date).toLocaleString()}</time>
            </div>
          </div>
        `).join('')}
      </div>
    `
  }

  /**
   * Get timeline icon
   */
  getTimelineIcon(type) {
    const icons = {
      created: '📝',
      updated: '✏️',
      shared: '📤'
    }
    return icons[type] || '📅'
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Back button
    const backBtn = this.container.querySelector('#back-btn')
    backBtn?.addEventListener('click', () => {
      router.navigate('/memories')
    })

    // Edit button
    const editBtn = this.container.querySelector('#edit-memorial-btn')
    editBtn?.addEventListener('click', () => {
      this.showEditModal()
    })

    // Share button
    const shareBtn = this.container.querySelector('#share-memorial-btn')
    shareBtn?.addEventListener('click', () => {
      router.navigate('/sharing')
    })

    // View in AR button
    const viewInARBtn = this.container.querySelector('#view-in-ar-btn')
    viewInARBtn?.addEventListener('click', () => {
      router.navigate('/altar')
    })

    // Add offering button
    const addOfferingBtn = this.container.querySelector('#add-offering-btn')
    addOfferingBtn?.addEventListener('click', () => {
      this.showAddOfferingModal()
    })

    // Connection links
    const connectionLinks = this.container.querySelectorAll('.connection-link')
    connectionLinks.forEach(link => {
      link.addEventListener('click', () => {
        const memorialId = link.dataset.memorialId
        if (memorialId) {
          router.navigate(`/memories/${memorialId}`)
        }
      })
    })
  }

  /**
   * Show edit modal
   */
  showEditModal() {
    // This would show a modal similar to the add memorial form
    // but pre-populated with current values
    const modal = new Modal({
      title: i18n.t('memory.edit_memorial'),
      content: `<p>${i18n.t('memory.edit_coming_soon')}</p>`,
      size: 'large'
    })

    modal.show()
  }

  /**
   * Show add offering modal
   */
  showAddOfferingModal() {
    const modal = new Modal({
      title: i18n.t('memory.add_offering'),
      content: `
        <div class="offering-selection">
          <p>${i18n.t('memory.select_offering')}</p>
          <div class="offering-grid">
            <button class="offering-option" data-offering="cempasuchil">
              <span class="offering-icon">🌼</span>
              <span class="offering-name">${i18n.t('offerings.cempasuchil')}</span>
            </button>
            <button class="offering-option" data-offering="pan_de_muerto">
              <span class="offering-icon">🍞</span>
              <span class="offering-name">${i18n.t('offerings.pan_de_muerto')}</span>
            </button>
            <button class="offering-option" data-offering="agua">
              <span class="offering-icon">💧</span>
              <span class="offering-name">${i18n.t('offerings.agua')}</span>
            </button>
            <button class="offering-option" data-offering="vela">
              <span class="offering-icon">🕯️</span>
              <span class="offering-name">${i18n.t('offerings.vela')}</span>
            </button>
          </div>
        </div>
      `,
      onConfirm: () => {
        // Handle offering selection
        modal.hide()
      }
    })

    modal.show()

    // Setup offering selection
    const offeringOptions = modal.element.querySelectorAll('.offering-option')
    offeringOptions.forEach(option => {
      option.addEventListener('click', () => {
        const offering = option.dataset.offering
        this.addOffering(offering)
        modal.hide()
      })
    })
  }

  /**
   * Add offering to memorial
   */
  addOffering(offering) {
    const currentOfferings = this.memorial.virtualOfferings?.items || []
    
    if (!currentOfferings.includes(offering)) {
      const updatedMemorial = {
        ...this.memorial,
        virtualOfferings: {
          ...this.memorial.virtualOfferings,
          items: [...currentOfferings, offering]
        },
        updatedAt: new Date()
      }

      appState.actions.updateMemorial(this.memorial.id, updatedMemorial)
      
      appState.actions.showNotification({
        type: 'success',
        title: i18n.t('memory.offering_added'),
        message: i18n.t('memory.offering_added_message', { offering: i18n.t('offerings.' + offering) })
      })

      // Refresh view
      this.render()
    }
  }

  /**
   * Show not found state
   */
  showNotFound() {
    this.container.innerHTML = `
      <div class="memory-not-found">
        <div class="container">
          <h2>😔 ${i18n.t('memory.not_found')}</h2>
          <p>${i18n.t('memory.not_found_desc')}</p>
          <button class="btn btn-primary" onclick="router.navigate('/memories')">
            ${i18n.t('actions.back_to_memories')}
          </button>
        </div>
      </div>
    `
  }

  /**
   * Show error state
   */
  showError(error) {
    this.container.innerHTML = `
      <div class="memory-detail-error">
        <div class="container">
          <h2>😔 ${i18n.t('errors.memory_detail_load_failed')}</h2>
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
    console.log('🧹 Memory Detail View disposed')
  }
}
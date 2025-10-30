/**
 * Modal System Component
 * Accessible modal dialogs with focus management
 */

import { appState } from '../../state/AppState.js'
import { i18n } from '../../i18n/i18n.js'

export class Modal {
  constructor(options = {}) {
    this.id = options.id || `modal-${Date.now()}`
    this.title = options.title || ''
    this.content = options.content || ''
    this.size = options.size || 'medium' // 'small', 'medium', 'large', 'fullscreen'
    this.closable = options.closable !== false
    this.backdrop = options.backdrop !== false
    this.keyboard = options.keyboard !== false
    this.focus = options.focus !== false
    this.onShow = options.onShow || null
    this.onHide = options.onHide || null
    this.onConfirm = options.onConfirm || null
    this.onCancel = options.onCancel || null
    
    this.element = null
    this.isVisible = false
    this.previousFocus = null
    this.focusableElements = []
    this.currentFocusIndex = 0
  }

  /**
   * Show modal
   */
  show() {
    if (this.isVisible) return

    // Store current focus
    this.previousFocus = document.activeElement

    // Create modal element
    this.createElement()
    
    // Add to DOM
    document.body.appendChild(this.element)
    
    // Setup event listeners
    this.setupEventListeners()
    
    // Show modal
    requestAnimationFrame(() => {
      this.element.classList.add('show')
      this.isVisible = true
      
      // Focus management
      if (this.focus) {
        this.focusModal()
      }
      
      // Add to app state
      appState.push('ui.modals', {
        id: this.id,
        instance: this
      })
      
      // Callback
      if (this.onShow) {
        this.onShow(this)
      }
    })

    // Prevent body scroll
    document.body.style.overflow = 'hidden'
    
    return this
  }

  /**
   * Hide modal
   */
  hide() {
    if (!this.isVisible) return

    this.element.classList.remove('show')
    this.isVisible = false
    
    // Animation end
    setTimeout(() => {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element)
      }
      
      // Restore focus
      if (this.previousFocus) {
        this.previousFocus.focus()
      }
      
      // Remove from app state
      appState.remove('ui.modals', modal => modal.id === this.id)
      
      // Restore body scroll if no other modals
      const remainingModals = appState.get('ui.modals') || []
      if (remainingModals.length === 0) {
        document.body.style.overflow = ''
      }
      
      // Callback
      if (this.onHide) {
        this.onHide(this)
      }
    }, 300)
    
    return this
  }

  /**
   * Create modal element
   */
  createElement() {
    this.element = document.createElement('div')
    this.element.className = `modal modal-${this.size}`
    this.element.id = this.id
    this.element.setAttribute('role', 'dialog')
    this.element.setAttribute('aria-modal', 'true')
    this.element.setAttribute('aria-labelledby', `${this.id}-title`)
    this.element.setAttribute('aria-describedby', `${this.id}-content`)
    this.element.setAttribute('tabindex', '-1')

    this.element.innerHTML = `
      ${this.backdrop ? '<div class="modal-backdrop"></div>' : ''}
      <div class="modal-dialog">
        <div class="modal-content">
          ${this.title ? `
            <div class="modal-header">
              <h2 class="modal-title" id="${this.id}-title">${this.title}</h2>
              ${this.closable ? `
                <button 
                  class="modal-close" 
                  type="button" 
                  aria-label="${i18n.t('ui.close')}"
                  title="${i18n.t('ui.close')}"
                >
                  <span aria-hidden="true">×</span>
                </button>
              ` : ''}
            </div>
          ` : ''}
          
          <div class="modal-body" id="${this.id}-content">
            ${this.content}
          </div>
          
          ${this.onConfirm || this.onCancel ? `
            <div class="modal-footer">
              ${this.onCancel ? `
                <button class="btn btn-outline modal-cancel" type="button">
                  ${i18n.t('ui.cancel')}
                </button>
              ` : ''}
              ${this.onConfirm ? `
                <button class="btn btn-primary modal-confirm" type="button">
                  ${i18n.t('ui.confirm')}
                </button>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Close button
    if (this.closable) {
      const closeBtn = this.element.querySelector('.modal-close')
      closeBtn?.addEventListener('click', () => this.hide())
    }

    // Backdrop click
    if (this.backdrop && this.closable) {
      const backdrop = this.element.querySelector('.modal-backdrop')
      backdrop?.addEventListener('click', () => this.hide())
    }

    // Confirm/Cancel buttons
    const confirmBtn = this.element.querySelector('.modal-confirm')
    const cancelBtn = this.element.querySelector('.modal-cancel')
    
    confirmBtn?.addEventListener('click', () => {
      if (this.onConfirm) {
        const result = this.onConfirm(this)
        if (result !== false) {
          this.hide()
        }
      } else {
        this.hide()
      }
    })
    
    cancelBtn?.addEventListener('click', () => {
      if (this.onCancel) {
        this.onCancel(this)
      }
      this.hide()
    })

    // Keyboard events
    if (this.keyboard) {
      this.element.addEventListener('keydown', (e) => this.handleKeydown(e))
    }

    // Focus trap
    if (this.focus) {
      this.setupFocusTrap()
    }
  }

  /**
   * Handle keydown events
   */
  handleKeydown(e) {
    switch (e.key) {
      case 'Escape':
        if (this.closable) {
          e.preventDefault()
          this.hide()
        }
        break
        
      case 'Tab':
        if (this.focus) {
          this.handleTabKey(e)
        }
        break
        
      case 'Enter':
        if (e.target.classList.contains('modal-confirm')) {
          e.preventDefault()
          e.target.click()
        }
        break
    }
  }

  /**
   * Handle tab key for focus trap
   */
  handleTabKey(e) {
    if (this.focusableElements.length === 0) return

    const isTabPressed = e.key === 'Tab'
    if (!isTabPressed) return

    const firstElement = this.focusableElements[0]
    const lastElement = this.focusableElements[this.focusableElements.length - 1]

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }

  /**
   * Setup focus trap
   */
  setupFocusTrap() {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ]

    this.focusableElements = Array.from(
      this.element.querySelectorAll(focusableSelectors.join(', '))
    )
  }

  /**
   * Focus modal
   */
  focusModal() {
    // Focus first focusable element or modal itself
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus()
    } else {
      this.element.focus()
    }
  }

  /**
   * Update content
   */
  updateContent(content) {
    this.content = content
    const contentElement = this.element?.querySelector('.modal-body')
    if (contentElement) {
      contentElement.innerHTML = content
      
      // Re-setup focus trap
      if (this.focus) {
        this.setupFocusTrap()
      }
    }
    return this
  }

  /**
   * Update title
   */
  updateTitle(title) {
    this.title = title
    const titleElement = this.element?.querySelector('.modal-title')
    if (titleElement) {
      titleElement.textContent = title
    }
    return this
  }

  /**
   * Static method to create and show modal
   */
  static show(options) {
    const modal = new Modal(options)
    return modal.show()
  }

  /**
   * Static method to create confirmation modal
   */
  static confirm(options) {
    return new Promise((resolve) => {
      const modal = new Modal({
        title: options.title || i18n.t('ui.confirm'),
        content: options.message || '',
        size: options.size || 'small',
        onConfirm: () => {
          resolve(true)
          return true
        },
        onCancel: () => {
          resolve(false)
        },
        onHide: () => {
          resolve(false)
        }
      })
      modal.show()
    })
  }

  /**
   * Static method to create alert modal
   */
  static alert(options) {
    return new Promise((resolve) => {
      const modal = new Modal({
        title: options.title || i18n.t('ui.alert'),
        content: options.message || '',
        size: options.size || 'small',
        onConfirm: () => {
          resolve(true)
          return true
        },
        onHide: () => {
          resolve(true)
        }
      })
      modal.show()
    })
  }

  /**
   * Static method to hide all modals
   */
  static hideAll() {
    const modals = appState.get('ui.modals') || []
    modals.forEach(modal => {
      if (modal.instance) {
        modal.instance.hide()
      }
    })
  }
}
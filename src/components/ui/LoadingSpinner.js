/**
 * Loading Spinner Component
 * Accessible loading states with customizable messages
 */

import { i18n } from '../../i18n/i18n.js'

export class LoadingSpinner {
  constructor(options = {}) {
    this.container = options.container || null
    this.message = options.message || i18n.t('ui.loading')
    this.size = options.size || 'medium' // 'small', 'medium', 'large'
    this.overlay = options.overlay !== false
    this.theme = options.theme || 'primary' // 'primary', 'secondary', 'light', 'dark'
    this.element = null
    this.isVisible = false
  }

  /**
   * Show loading spinner
   */
  show() {
    if (this.isVisible) return this

    this.createElement()
    
    if (this.container) {
      this.container.appendChild(this.element)
    } else {
      document.body.appendChild(this.element)
    }
    
    // Animate in
    requestAnimationFrame(() => {
      this.element.classList.add('show')
      this.isVisible = true
    })

    return this
  }

  /**
   * Hide loading spinner
   */
  hide() {
    if (!this.isVisible || !this.element) return this

    this.element.classList.remove('show')
    this.isVisible = false
    
    // Remove after animation
    setTimeout(() => {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element)
      }
    }, 300)

    return this
  }

  /**
   * Update message
   */
  updateMessage(message) {
    this.message = message
    const messageElement = this.element?.querySelector('.loading-message')
    if (messageElement) {
      messageElement.textContent = message
    }
    return this
  }

  /**
   * Create loading element
   */
  createElement() {
    this.element = document.createElement('div')
    this.element.className = `loading-spinner loading-${this.size} loading-${this.theme}`
    
    if (this.overlay) {
      this.element.classList.add('loading-overlay')
    }
    
    this.element.setAttribute('role', 'status')
    this.element.setAttribute('aria-live', 'polite')
    this.element.setAttribute('aria-label', this.message)

    this.element.innerHTML = `
      <div class="loading-content">
        <div class="spinner-container">
          <div class="spinner" aria-hidden="true">
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
          </div>
        </div>
        
        <div class="loading-message" aria-live="polite">
          ${this.message}
        </div>
        
        <div class="loading-dots" aria-hidden="true">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    `
  }

  /**
   * Static method to show loading
   */
  static show(options = {}) {
    return new LoadingSpinner(options).show()
  }

  /**
   * Static method for inline loading
   */
  static inline(container, message) {
    return new LoadingSpinner({
      container,
      message,
      overlay: false,
      size: 'small'
    }).show()
  }

  /**
   * Static method for overlay loading
   */
  static overlay(message) {
    return new LoadingSpinner({
      message,
      overlay: true,
      size: 'large'
    }).show()
  }
}

/**
 * Loading States Manager
 * Manages multiple loading states across the application
 */
export class LoadingManager {
  constructor() {
    this.loadingStates = new Map()
    this.globalSpinner = null
  }

  /**
   * Start loading state
   */
  start(key, options = {}) {
    // Stop existing loading for this key
    this.stop(key)
    
    const spinner = new LoadingSpinner(options)
    spinner.show()
    
    this.loadingStates.set(key, spinner)
    
    return spinner
  }

  /**
   * Stop loading state
   */
  stop(key) {
    const spinner = this.loadingStates.get(key)
    if (spinner) {
      spinner.hide()
      this.loadingStates.delete(key)
    }
  }

  /**
   * Update loading message
   */
  updateMessage(key, message) {
    const spinner = this.loadingStates.get(key)
    if (spinner) {
      spinner.updateMessage(message)
    }
  }

  /**
   * Check if loading
   */
  isLoading(key) {
    return this.loadingStates.has(key)
  }

  /**
   * Stop all loading states
   */
  stopAll() {
    this.loadingStates.forEach(spinner => spinner.hide())
    this.loadingStates.clear()
  }

  /**
   * Show global loading
   */
  showGlobal(message) {
    if (this.globalSpinner) {
      this.hideGlobal()
    }
    
    this.globalSpinner = LoadingSpinner.overlay(message)
    return this.globalSpinner
  }

  /**
   * Hide global loading
   */
  hideGlobal() {
    if (this.globalSpinner) {
      this.globalSpinner.hide()
      this.globalSpinner = null
    }
  }

  /**
   * Update global message
   */
  updateGlobalMessage(message) {
    if (this.globalSpinner) {
      this.globalSpinner.updateMessage(message)
    }
  }
}

// Create singleton instance
export const loadingManager = new LoadingManager()
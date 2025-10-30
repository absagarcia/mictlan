/**
 * Notification System Component
 * Toast notifications with accessibility support
 */

import { appState } from '../../state/AppState.js'
import { i18n } from '../../i18n/i18n.js'

export class NotificationSystem {
  constructor() {
    this.container = null
    this.notifications = new Map()
    this.isInitialized = false
    this.maxNotifications = 5
    this.defaultDuration = 5000
  }

  /**
   * Initialize notification system
   */
  init() {
    if (this.isInitialized) return

    this.createContainer()
    this.setupEventListeners()
    
    this.isInitialized = true
    console.log('🔔 Notification System initialized')
  }

  /**
   * Create notification container
   */
  createContainer() {
    this.container = document.createElement('div')
    this.container.className = 'notifications-container'
    this.container.setAttribute('aria-live', 'polite')
    this.container.setAttribute('aria-label', 'Notificaciones')
    this.container.setAttribute('role', 'region')
    
    document.body.appendChild(this.container)
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for notification changes in app state
    appState.subscribe('ui.notifications', (notifications) => {
      this.updateNotifications(notifications)
    })
  }

  /**
   * Show notification
   */
  show(options) {
    const notification = {
      id: options.id || `notification-${Date.now()}`,
      type: options.type || 'info', // 'success', 'warning', 'error', 'info'
      title: options.title || '',
      message: options.message || '',
      duration: options.duration !== undefined ? options.duration : this.defaultDuration,
      persistent: options.persistent || false,
      actions: options.actions || [],
      icon: options.icon || this.getDefaultIcon(options.type),
      timestamp: new Date()
    }

    // Add to app state
    appState.actions.showNotification(notification)
    
    return notification.id
  }

  /**
   * Hide notification
   */
  hide(id) {
    appState.actions.removeNotification(id)
  }

  /**
   * Update notifications display
   */
  updateNotifications(notifications) {
    if (!this.container) return

    // Clear existing notifications
    this.container.innerHTML = ''
    this.notifications.clear()

    // Limit number of notifications
    const visibleNotifications = notifications.slice(-this.maxNotifications)

    // Create notification elements
    visibleNotifications.forEach(notification => {
      const element = this.createNotificationElement(notification)
      this.container.appendChild(element)
      this.notifications.set(notification.id, element)
      
      // Auto-hide non-persistent notifications
      if (!notification.persistent && notification.duration > 0) {
        setTimeout(() => {
          this.hide(notification.id)
        }, notification.duration)
      }
    })
  }

  /**
   * Create notification element
   */
  createNotificationElement(notification) {
    const element = document.createElement('div')
    element.className = `notification notification-${notification.type}`
    element.setAttribute('role', 'alert')
    element.setAttribute('aria-live', 'assertive')
    element.setAttribute('data-notification-id', notification.id)

    element.innerHTML = `
      <div class="notification-icon" aria-hidden="true">
        ${notification.icon}
      </div>
      
      <div class="notification-content">
        ${notification.title ? `
          <div class="notification-title">
            ${notification.title}
          </div>
        ` : ''}
        
        <div class="notification-message">
          ${notification.message}
        </div>
        
        ${notification.actions.length > 0 ? `
          <div class="notification-actions">
            ${notification.actions.map(action => `
              <button 
                class="notification-action btn btn-sm" 
                data-action="${action.id || 'action'}"
                type="button"
              >
                ${action.label}
              </button>
            `).join('')}
          </div>
        ` : ''}
        
        <div class="notification-meta">
          <time class="notification-time" datetime="${notification.timestamp.toISOString()}">
            ${this.formatTime(notification.timestamp)}
          </time>
        </div>
      </div>
      
      <button 
        class="notification-close" 
        type="button"
        aria-label="${i18n.t('ui.close_notification')}"
        title="${i18n.t('ui.close')}"
      >
        <span aria-hidden="true">×</span>
      </button>
    `

    // Setup event listeners
    this.setupNotificationEvents(element, notification)
    
    // Animate in
    requestAnimationFrame(() => {
      element.classList.add('show')
    })

    return element
  }

  /**
   * Setup notification event listeners
   */
  setupNotificationEvents(element, notification) {
    // Close button
    const closeBtn = element.querySelector('.notification-close')
    closeBtn?.addEventListener('click', () => {
      this.hide(notification.id)
    })

    // Action buttons
    const actionBtns = element.querySelectorAll('.notification-action')
    actionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const actionId = btn.dataset.action
        const action = notification.actions.find(a => (a.id || 'action') === actionId)
        
        if (action && action.handler) {
          action.handler(notification)
        }
        
        // Auto-hide after action unless persistent
        if (!notification.persistent) {
          this.hide(notification.id)
        }
      })
    })

    // Auto-hide on click (for simple notifications)
    if (notification.actions.length === 0 && !notification.persistent) {
      element.addEventListener('click', () => {
        this.hide(notification.id)
      })
    }

    // Keyboard support
    element.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide(notification.id)
      }
    })
  }

  /**
   * Get default icon for notification type
   */
  getDefaultIcon(type) {
    const icons = {
      success: '✅',
      warning: '⚠️',
      error: '❌',
      info: 'ℹ️'
    }
    return icons[type] || icons.info
  }

  /**
   * Format timestamp
   */
  formatTime(timestamp) {
    const now = new Date()
    const diff = now - timestamp
    
    if (diff < 60000) { // Less than 1 minute
      return i18n.t('time.just_now')
    } else if (diff < 3600000) { // Less than 1 hour
      const minutes = Math.floor(diff / 60000)
      return i18n.t('time.minutes_ago', { count: minutes })
    } else {
      return timestamp.toLocaleTimeString()
    }
  }

  /**
   * Clear all notifications
   */
  clearAll() {
    appState.set('ui.notifications', [])
  }

  /**
   * Show success notification
   */
  success(message, title, options = {}) {
    return this.show({
      type: 'success',
      title,
      message,
      ...options
    })
  }

  /**
   * Show warning notification
   */
  warning(message, title, options = {}) {
    return this.show({
      type: 'warning',
      title,
      message,
      ...options
    })
  }

  /**
   * Show error notification
   */
  error(message, title, options = {}) {
    return this.show({
      type: 'error',
      title,
      message,
      persistent: true, // Errors should be persistent by default
      ...options
    })
  }

  /**
   * Show info notification
   */
  info(message, title, options = {}) {
    return this.show({
      type: 'info',
      title,
      message,
      ...options
    })
  }

  /**
   * Show loading notification
   */
  loading(message, title, options = {}) {
    return this.show({
      type: 'info',
      title,
      message,
      icon: '⏳',
      persistent: true,
      ...options
    })
  }

  /**
   * Update existing notification
   */
  update(id, updates) {
    const notifications = appState.get('ui.notifications') || []
    const index = notifications.findIndex(n => n.id === id)
    
    if (index !== -1) {
      const updated = { ...notifications[index], ...updates }
      const newNotifications = [...notifications]
      newNotifications[index] = updated
      appState.set('ui.notifications', newNotifications)
    }
  }

  /**
   * Dispose notification system
   */
  dispose() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
    
    this.notifications.clear()
    this.isInitialized = false
    console.log('🧹 Notification System disposed')
  }
}

// Create singleton instance
export const notificationSystem = new NotificationSystem()
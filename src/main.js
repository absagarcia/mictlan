/**
 * Mictla - Main Application Entry Point
 * AR Altar de Muertos con Libro de Memorias Familiar
 */

import { appState } from './state/AppState.js'
import { router } from './router/Router.js'
import { i18n } from './i18n/i18n.js'
import { accessibilityManager } from './utils/accessibility.js'
import './styles/main.css'
import './styles/accessibility.css'

class MictlaApp {
  constructor() {
    this.initialized = false
    this.container = null
  }

  /**
   * Initialize the application
   */
  async init() {
    if (this.initialized) return

    console.log('🌺 Initializing Mictla...')

    try {
      // Setup container
      this.container = document.getElementById('app') || document.body
      
      // Initialize accessibility manager first
      accessibilityManager.init()
      
      // Initialize core systems
      await this.initializeCore()
      
      // Setup routes
      this.setupRoutes()
      
      // Initialize router
      router.init(this.container)
      
      // Setup PWA
      this.setupPWA()
      
      // Setup theme
      this.setupTheme()
      
      // Add skip link
      this.addSkipLink()
      
      // Mark as initialized
      this.initialized = true
      
      console.log('✅ Mictla initialized successfully')
      
    } catch (error) {
      console.error('❌ Failed to initialize Mictla:', error)
      this.showErrorFallback(error)
    }
  }

  /**
   * Initialize core application systems
   */
  async initializeCore() {
    // Initialize i18n system
    i18n.init()
    
    // Set up app state subscriptions
    this.setupStateSubscriptions()
    
    // Check WebXR support
    await this.checkWebXRSupport()
    
    // Initialize storage
    await this.initializeStorage()
  }

  /**
   * Setup application routes
   */
  setupRoutes() {
    // Home route
    router.route('/', async ({ container }) => {
      const { HomeView } = await import('./views/HomeView.js')
      const view = new HomeView(container)
      await view.render()
    })

    // Altar AR route
    router.route('/altar', async ({ container }) => {
      const { AltarView } = await import('./views/AltarView.js')
      const view = new AltarView(container)
      await view.render()
    })

    // Memory book route
    router.route('/memories', async ({ container }) => {
      const { MemoryView } = await import('./views/MemoryView.js')
      const view = new MemoryView(container)
      await view.render()
    })

    // Individual memory route
    router.route('/memories/:id', async ({ container, params }) => {
      const { MemoryDetailView } = await import('./views/MemoryDetailView.js')
      const view = new MemoryDetailView(container, params.id)
      await view.render()
    })

    // Family sharing route
    router.route('/family', async ({ container }) => {
      const { FamilyView } = await import('./views/FamilyView.js')
      const view = new FamilyView(container)
      await view.render()
    })

    // Educational content route
    router.route('/learn', async ({ container }) => {
      const { LearnView } = await import('./views/LearnView.js')
      const view = new LearnView(container)
      await view.render()
    })

    // Settings route
    router.route('/settings', async ({ container }) => {
      const { SettingsView } = await import('./views/SettingsView.js')
      const view = new SettingsView(container)
      await view.render()
    })

    // 404 route
    router.route('/404', async ({ container }) => {
      const { NotFoundView } = await import('./views/NotFoundView.js')
      const view = new NotFoundView(container)
      await view.render()
    })
  }

  /**
   * Setup app state subscriptions
   */
  setupStateSubscriptions() {
    // Language changes
    appState.subscribe('user.language', (language) => {
      document.documentElement.lang = language
      i18n.setLanguage(language)
    })

    // Theme changes
    appState.subscribe('ui.theme', (theme) => {
      this.applyTheme(theme)
    })

    // Loading state changes
    appState.subscribe('ui.loading', (loading) => {
      this.toggleLoadingState(loading)
    })

    // Notification changes
    appState.subscribe('ui.notifications', (notifications) => {
      this.updateNotifications(notifications)
    })
  }

  /**
   * Check WebXR support
   */
  async checkWebXRSupport() {
    try {
      if ('xr' in navigator) {
        const supported = await navigator.xr.isSessionSupported('immersive-ar')
        appState.set('arSession.isSupported', supported)
        
        if (supported) {
          console.log('✅ WebXR AR supported')
        } else {
          console.log('⚠️ WebXR AR not supported, will use 3D fallback')
        }
      } else {
        console.log('⚠️ WebXR not available, will use 3D fallback')
        appState.set('arSession.isSupported', false)
      }
    } catch (error) {
      console.warn('WebXR support check failed:', error)
      appState.set('arSession.isSupported', false)
    }
  }

  /**
   * Initialize storage systems
   */
  async initializeStorage() {
    try {
      // Initialize IndexedDB for memorials
      const { StorageManager } = await import('./services/StorageManager.js')
      const storage = new StorageManager()
      await storage.init()
      
      // Load existing memorials
      const memorials = await storage.getMemorials()
      appState.set('memorials', memorials)
      
      console.log(`📚 Loaded ${memorials.length} memorials from storage`)
      
    } catch (error) {
      console.error('Storage initialization failed:', error)
      // Continue without storage - app should still work
    }
  }

  /**
   * Setup PWA functionality
   */
  setupPWA() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('✅ Service Worker registered:', registration)
          
          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Show update notification
                appState.actions.showNotification({
                  type: 'info',
                  title: i18n.t('pwa.update_available'),
                  message: i18n.t('pwa.update_now'),
                  persistent: true,
                  actions: [{
                    label: i18n.t('pwa.update_now'),
                    action: () => window.location.reload()
                  }]
                })
              }
            })
          })
        })
        .catch(error => {
          console.warn('Service Worker registration failed:', error)
        })
    }

    // Handle install prompt
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault()
      
      // Show install notification
      appState.actions.showNotification({
        type: 'info',
        title: i18n.t('pwa.install'),
        message: i18n.t('app.description'),
        persistent: true,
        actions: [{
          label: i18n.t('pwa.install'),
          action: () => {
            event.prompt()
            event.userChoice.then(result => {
              if (result.outcome === 'accepted') {
                console.log('✅ PWA installed')
              }
            })
          }
        }]
      })
    })

    // Handle online/offline status
    window.addEventListener('online', () => {
      appState.actions.showNotification({
        type: 'success',
        title: i18n.t('pwa.online'),
        message: 'Conexión restaurada'
      })
    })

    window.addEventListener('offline', () => {
      appState.actions.showNotification({
        type: 'warning',
        title: i18n.t('pwa.offline'),
        message: 'Trabajando sin conexión'
      })
    })
  }

  /**
   * Setup theme system
   */
  setupTheme() {
    const theme = appState.get('ui.theme')
    this.applyTheme(theme)
    
    // Auto theme based on system preference
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', (e) => {
        if (appState.get('ui.theme') === 'auto') {
          this.applyTheme('auto')
        }
      })
    }
  }

  /**
   * Apply theme to document
   */
  applyTheme(theme) {
    let actualTheme = theme
    
    if (theme === 'auto') {
      actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    
    document.documentElement.setAttribute('data-theme', actualTheme)
    document.documentElement.style.colorScheme = actualTheme
  }

  /**
   * Toggle loading state
   */
  toggleLoadingState(loading) {
    const loadingElement = document.getElementById('loading-overlay')
    
    if (loading) {
      if (!loadingElement) {
        const overlay = document.createElement('div')
        overlay.id = 'loading-overlay'
        overlay.className = 'loading-overlay'
        overlay.innerHTML = `
          <div class="loading-spinner">
            <div class="spinner"></div>
            <p data-i18n="ui.loading">${i18n.t('ui.loading')}</p>
          </div>
        `
        document.body.appendChild(overlay)
      }
      loadingElement?.classList.add('active')
    } else {
      loadingElement?.classList.remove('active')
    }
  }

  /**
   * Update notifications display
   */
  updateNotifications(notifications) {
    let container = document.getElementById('notifications-container')
    
    if (!container) {
      container = document.createElement('div')
      container.id = 'notifications-container'
      container.className = 'notifications-container'
      document.body.appendChild(container)
    }
    
    // Clear existing notifications
    container.innerHTML = ''
    
    // Add current notifications
    notifications.forEach(notification => {
      const element = document.createElement('div')
      element.className = `notification notification-${notification.type}`
      element.innerHTML = `
        <div class="notification-content">
          <h4>${notification.title || ''}</h4>
          <p>${notification.message}</p>
          ${notification.actions ? notification.actions.map(action => 
            `<button class="notification-action" data-action="${action.action}">${action.label}</button>`
          ).join('') : ''}
        </div>
        <button class="notification-close" data-id="${notification.id}">×</button>
      `
      
      // Add event listeners
      element.querySelector('.notification-close')?.addEventListener('click', () => {
        appState.actions.removeNotification(notification.id)
      })
      
      notification.actions?.forEach(action => {
        element.querySelector(`[data-action="${action.action}"]`)?.addEventListener('click', () => {
          if (typeof action.action === 'function') {
            action.action()
          }
          appState.actions.removeNotification(notification.id)
        })
      })
      
      container.appendChild(element)
    })
  }

  /**
   * Add skip link for accessibility
   */
  addSkipLink() {
    const skipLink = accessibilityManager.createSkipLink('#main-content', 'Saltar al contenido principal')
    document.body.insertBefore(skipLink, document.body.firstChild)
  }

  /**
   * Show error fallback
   */
  showErrorFallback(error) {
    const container = this.container || document.body
    container.innerHTML = `
      <div class="error-fallback">
        <h1>😔 Error al cargar Mictla</h1>
        <p>Ocurrió un error inesperado al inicializar la aplicación.</p>
        <details>
          <summary>Detalles técnicos</summary>
          <pre>${error.message}\n${error.stack}</pre>
        </details>
        <button onclick="window.location.reload()">Reintentar</button>
      </div>
    `
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp)
} else {
  initApp()
}

async function initApp() {
  const app = new MictlaApp()
  await app.init()
}

// Export for testing
export { MictlaApp }
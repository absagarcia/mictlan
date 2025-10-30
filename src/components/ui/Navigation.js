/**
 * Main Navigation Component
 * Responsive navigation with accessibility support
 */

import { appState } from '../../state/AppState.js'
import { router } from '../../router/Router.js'
import { i18n } from '../../i18n/i18n.js'

export class Navigation {
  constructor(container) {
    this.container = container
    this.isInitialized = false
    this.isMobileMenuOpen = false
    this.currentRoute = '/'
  }

  /**
   * Initialize navigation
   */
  async init() {
    if (this.isInitialized) return

    console.log('🧭 Initializing Navigation Component...')

    try {
      this.render()
      this.setupEventListeners()
      this.updateActiveState()
      
      this.isInitialized = true
      console.log('✅ Navigation Component initialized')
      
    } catch (error) {
      console.error('❌ Failed to initialize Navigation Component:', error)
      throw error
    }
  }

  /**
   * Render navigation
   */
  render() {
    if (!this.container) return

    const memorialCount = appState.get('memorials')?.length || 0
    const currentLanguage = appState.get('user.language') || 'es'
    const currentTheme = appState.get('ui.theme') || 'auto'

    this.container.innerHTML = `
      <nav class="main-nav" role="navigation" aria-label="Navegación principal">
        <div class="nav-container container">
          <!-- Brand/Logo -->
          <div class="nav-brand">
            <a href="/" class="brand-link" aria-label="Mictla - Inicio">
              <span class="brand-icon">🌺</span>
              <span class="brand-text">Mictla</span>
            </a>
          </div>

          <!-- Mobile menu button -->
          <button 
            class="mobile-menu-btn" 
            aria-expanded="false" 
            aria-controls="main-menu"
            aria-label="Abrir menú de navegación"
          >
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
          </button>

          <!-- Main menu -->
          <div class="nav-menu" id="main-menu">
            <ul class="nav-list" role="menubar">
              <li class="nav-item" role="none">
                <a 
                  href="/" 
                  class="nav-link" 
                  role="menuitem"
                  data-route="/"
                  aria-label="Ir al inicio"
                >
                  <span class="nav-icon">🏠</span>
                  <span class="nav-text">${i18n.t('nav.home')}</span>
                </a>
              </li>
              
              <li class="nav-item" role="none">
                <a 
                  href="/altar" 
                  class="nav-link" 
                  role="menuitem"
                  data-route="/altar"
                  aria-label="Ver altar en realidad aumentada"
                >
                  <span class="nav-icon">🕯️</span>
                  <span class="nav-text">${i18n.t('nav.altar')}</span>
                </a>
              </li>
              
              <li class="nav-item" role="none">
                <a 
                  href="/memories" 
                  class="nav-link" 
                  role="menuitem"
                  data-route="/memories"
                  aria-label="Ver libro de memorias (${memorialCount} memorias)"
                >
                  <span class="nav-icon">📖</span>
                  <span class="nav-text">${i18n.t('nav.memories')}</span>
                  ${memorialCount > 0 ? `<span class="nav-badge">${memorialCount}</span>` : ''}
                </a>
              </li>
              
              <li class="nav-item" role="none">
                <a 
                  href="/family" 
                  class="nav-link" 
                  role="menuitem"
                  data-route="/family"
                  aria-label="Compartir con familia"
                >
                  <span class="nav-icon">👨‍👩‍👧‍👦</span>
                  <span class="nav-text">${i18n.t('nav.family')}</span>
                </a>
              </li>
              
              <li class="nav-item" role="none">
                <a 
                  href="/sharing" 
                  class="nav-link" 
                  role="menuitem"
                  data-route="/sharing"
                  aria-label="Compartir y exportar memorias"
                >
                  <span class="nav-icon">📤</span>
                  <span class="nav-text">${i18n.t('sharing.title')}</span>
                </a>
              </li>
              
              <li class="nav-item" role="none">
                <a 
                  href="/learn" 
                  class="nav-link" 
                  role="menuitem"
                  data-route="/learn"
                  aria-label="Aprender sobre tradiciones"
                >
                  <span class="nav-icon">🎓</span>
                  <span class="nav-text">${i18n.t('nav.learn')}</span>
                </a>
              </li>
            </ul>

            <!-- Settings and controls -->
            <div class="nav-controls">
              <!-- Language toggle -->
              <button 
                class="control-btn language-btn" 
                aria-label="Cambiar idioma (${currentLanguage === 'es' ? 'Español' : 'English'})"
                title="Cambiar idioma"
              >
                <span class="control-icon">${currentLanguage === 'es' ? '🇪🇸' : '🇺🇸'}</span>
                <span class="control-text">${currentLanguage.toUpperCase()}</span>
              </button>

              <!-- Theme toggle -->
              <button 
                class="control-btn theme-btn" 
                aria-label="Cambiar tema (${this.getThemeLabel(currentTheme)})"
                title="Cambiar tema"
              >
                <span class="control-icon">${this.getThemeIcon(currentTheme)}</span>
              </button>

              <!-- Settings -->
              <a 
                href="/settings" 
                class="control-btn settings-btn" 
                aria-label="Configuración"
                title="Configuración"
              >
                <span class="control-icon">⚙️</span>
              </a>
            </div>
          </div>
        </div>
      </nav>
    `
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuBtn = this.container.querySelector('.mobile-menu-btn')
    mobileMenuBtn?.addEventListener('click', () => {
      this.toggleMobileMenu()
    })

    // Navigation links
    const navLinks = this.container.querySelectorAll('.nav-link')
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault()
        const route = link.dataset.route
        if (route) {
          this.navigateTo(route)
          this.closeMobileMenu()
        }
      })
    })

    // Language toggle
    const languageBtn = this.container.querySelector('.language-btn')
    languageBtn?.addEventListener('click', () => {
      this.toggleLanguage()
    })

    // Theme toggle
    const themeBtn = this.container.querySelector('.theme-btn')
    themeBtn?.addEventListener('click', () => {
      this.toggleTheme()
    })

    // Close mobile menu on outside click
    document.addEventListener('click', (e) => {
      if (this.isMobileMenuOpen && !this.container.contains(e.target)) {
        this.closeMobileMenu()
      }
    })

    // Close mobile menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMobileMenuOpen) {
        this.closeMobileMenu()
        mobileMenuBtn?.focus()
      }
    })

    // Listen for route changes
    appState.subscribe('ui.currentView', (view) => {
      this.currentRoute = view === 'home' ? '/' : `/${view}`
      this.updateActiveState()
    })

    // Listen for memorial count changes
    appState.subscribe('memorials', () => {
      this.updateMemorialBadge()
    })

    // Listen for language changes
    appState.subscribe('user.language', () => {
      this.render()
      this.setupEventListeners()
    })

    // Listen for theme changes
    appState.subscribe('ui.theme', () => {
      this.updateThemeButton()
    })
  }

  /**
   * Toggle mobile menu
   */
  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen
    
    const mobileMenuBtn = this.container.querySelector('.mobile-menu-btn')
    const navMenu = this.container.querySelector('.nav-menu')
    
    if (this.isMobileMenuOpen) {
      navMenu?.classList.add('open')
      mobileMenuBtn?.setAttribute('aria-expanded', 'true')
      mobileMenuBtn?.setAttribute('aria-label', 'Cerrar menú de navegación')
      
      // Focus first menu item
      const firstLink = navMenu?.querySelector('.nav-link')
      firstLink?.focus()
    } else {
      this.closeMobileMenu()
    }
  }

  /**
   * Close mobile menu
   */
  closeMobileMenu() {
    this.isMobileMenuOpen = false
    
    const mobileMenuBtn = this.container.querySelector('.mobile-menu-btn')
    const navMenu = this.container.querySelector('.nav-menu')
    
    navMenu?.classList.remove('open')
    mobileMenuBtn?.setAttribute('aria-expanded', 'false')
    mobileMenuBtn?.setAttribute('aria-label', 'Abrir menú de navegación')
  }

  /**
   * Navigate to route
   */
  navigateTo(route) {
    router.navigate(route)
  }

  /**
   * Update active navigation state
   */
  updateActiveState() {
    const navLinks = this.container.querySelectorAll('.nav-link')
    
    navLinks.forEach(link => {
      const route = link.dataset.route
      if (route === this.currentRoute) {
        link.classList.add('active')
        link.setAttribute('aria-current', 'page')
      } else {
        link.classList.remove('active')
        link.removeAttribute('aria-current')
      }
    })
  }

  /**
   * Update memorial badge
   */
  updateMemorialBadge() {
    const memorialCount = appState.get('memorials')?.length || 0
    const memoriesLink = this.container.querySelector('[data-route="/memories"]')
    
    if (memoriesLink) {
      const existingBadge = memoriesLink.querySelector('.nav-badge')
      existingBadge?.remove()
      
      if (memorialCount > 0) {
        const badge = document.createElement('span')
        badge.className = 'nav-badge'
        badge.textContent = memorialCount
        memoriesLink.appendChild(badge)
      }
      
      // Update aria-label
      memoriesLink.setAttribute('aria-label', `Ver libro de memorias (${memorialCount} memorias)`)
    }
  }

  /**
   * Toggle language
   */
  toggleLanguage() {
    const currentLanguage = appState.get('user.language')
    const newLanguage = currentLanguage === 'es' ? 'en' : 'es'
    
    appState.actions.setLanguage(newLanguage)
    
    // Show notification
    appState.actions.showNotification({
      type: 'info',
      title: i18n.t('notifications.language_changed'),
      message: `${i18n.t('notifications.language_set_to')} ${newLanguage === 'es' ? 'Español' : 'English'}`
    })
  }

  /**
   * Toggle theme
   */
  toggleTheme() {
    const currentTheme = appState.get('ui.theme')
    let newTheme
    
    switch (currentTheme) {
      case 'light':
        newTheme = 'dark'
        break
      case 'dark':
        newTheme = 'auto'
        break
      default:
        newTheme = 'light'
        break
    }
    
    appState.set('ui.theme', newTheme)
    
    // Apply theme immediately
    this.applyTheme(newTheme)
    
    // Show notification
    appState.actions.showNotification({
      type: 'info',
      title: i18n.t('notifications.theme_changed'),
      message: `${i18n.t('notifications.theme_set_to')} ${this.getThemeLabel(newTheme)}`
    })
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
   * Update theme button
   */
  updateThemeButton() {
    const currentTheme = appState.get('ui.theme')
    const themeBtn = this.container.querySelector('.theme-btn')
    
    if (themeBtn) {
      const icon = themeBtn.querySelector('.control-icon')
      icon.textContent = this.getThemeIcon(currentTheme)
      themeBtn.setAttribute('aria-label', `Cambiar tema (${this.getThemeLabel(currentTheme)})`)
    }
  }

  /**
   * Get theme icon
   */
  getThemeIcon(theme) {
    switch (theme) {
      case 'light':
        return '☀️'
      case 'dark':
        return '🌙'
      default:
        return '🌓'
    }
  }

  /**
   * Get theme label
   */
  getThemeLabel(theme) {
    switch (theme) {
      case 'light':
        return 'Claro'
      case 'dark':
        return 'Oscuro'
      default:
        return 'Automático'
    }
  }

  /**
   * Dispose navigation
   */
  dispose() {
    this.isInitialized = false
    console.log('🧹 Navigation Component disposed')
  }
}
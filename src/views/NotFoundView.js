/**
 * Not Found View - 404 error page
 * Displayed when a route is not found
 */

import { router } from '../router/Router.js'
import { i18n } from '../i18n/i18n.js'
import { Navigation } from '../components/ui/Navigation.js'

export class NotFoundView {
  constructor(container) {
    this.container = container
    this.navigation = null
  }

  /**
   * Render 404 view
   */
  async render() {
    console.log('🔍 Rendering 404 Not Found View...')

    try {
      this.container.innerHTML = `
        <div class="not-found-view">
          <!-- Navigation -->
          <nav id="main-navigation"></nav>
          
          <!-- Main Content -->
          <main id="main-content" class="not-found-content">
            <div class="container">
              <div class="not-found-container">
                <!-- 404 Illustration -->
                <div class="not-found-illustration">
                  <div class="error-code">404</div>
                  <div class="error-icon">🌺</div>
                </div>

                <!-- Error Message -->
                <div class="not-found-message">
                  <h1>${i18n.t('errors.page_not_found')}</h1>
                  <p class="error-description">
                    ${i18n.t('errors.page_not_found_desc')}
                  </p>
                </div>

                <!-- Suggested Actions -->
                <div class="not-found-actions">
                  <button class="btn btn-primary" id="go-home-btn">
                    <span>🏠</span>
                    ${i18n.t('actions.go_home')}
                  </button>
                  
                  <button class="btn btn-outline" id="go-back-btn">
                    <span>⬅️</span>
                    ${i18n.t('actions.go_back')}
                  </button>
                </div>

                <!-- Helpful Links -->
                <div class="helpful-links">
                  <h3>${i18n.t('errors.try_these_instead')}</h3>
                  <div class="links-grid">
                    <a href="/altar" class="link-card">
                      <span class="link-icon">🕯️</span>
                      <span class="link-text">${i18n.t('nav.altar')}</span>
                    </a>
                    
                    <a href="/memories" class="link-card">
                      <span class="link-icon">📖</span>
                      <span class="link-text">${i18n.t('nav.memories')}</span>
                    </a>
                    
                    <a href="/learn" class="link-card">
                      <span class="link-icon">🎓</span>
                      <span class="link-text">${i18n.t('nav.learn')}</span>
                    </a>
                    
                    <a href="/family" class="link-card">
                      <span class="link-icon">👨‍👩‍👧‍👦</span>
                      <span class="link-text">${i18n.t('nav.family')}</span>
                    </a>
                  </div>
                </div>

                <!-- Cultural Message -->
                <div class="cultural-message">
                  <blockquote>
                    <p>"${i18n.t('errors.cultural_quote')}"</p>
                    <cite>- ${i18n.t('errors.cultural_quote_source')}</cite>
                  </blockquote>
                </div>
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

      console.log('✅ 404 Not Found View rendered successfully')

    } catch (error) {
      console.error('❌ Failed to render 404 Not Found View:', error)
      this.showFallbackError(error)
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Go home button
    const goHomeBtn = this.container.querySelector('#go-home-btn')
    goHomeBtn?.addEventListener('click', () => {
      router.navigate('/')
    })

    // Go back button
    const goBackBtn = this.container.querySelector('#go-back-btn')
    goBackBtn?.addEventListener('click', () => {
      if (window.history.length > 1) {
        router.back()
      } else {
        router.navigate('/')
      }
    })

    // Link cards
    const linkCards = this.container.querySelectorAll('.link-card')
    linkCards.forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault()
        const href = card.getAttribute('href')
        if (href) {
          router.navigate(href)
        }
      })
    })
  }

  /**
   * Show fallback error if even the 404 page fails
   */
  showFallbackError(error) {
    this.container.innerHTML = `
      <div class="fallback-error">
        <div class="container">
          <h1>😔 ${i18n.t('errors.critical_error')}</h1>
          <p>${i18n.t('errors.critical_error_desc')}</p>
          <details>
            <summary>${i18n.t('errors.technical_details')}</summary>
            <pre>${error.message}\n${error.stack}</pre>
          </details>
          <button class="btn btn-primary" onclick="window.location.href='/'">
            ${i18n.t('actions.go_home')}
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
    console.log('🧹 404 Not Found View disposed')
  }
}
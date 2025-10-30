/**
 * Home View - Main landing page
 * Welcome screen with navigation to main features
 */

import { appState } from '../state/AppState.js'
import { router } from '../router/Router.js'
import { i18n } from '../i18n/i18n.js'
import { Navigation } from '../components/ui/Navigation.js'

export class HomeView {
  constructor(container) {
    this.container = container
    this.navigation = null
  }

  /**
   * Render home view
   */
  async render() {
    console.log('🏠 Rendering Home View...')

    try {
      this.container.innerHTML = `
        <div class="home-view">
          <!-- Navigation -->
          <nav id="main-navigation"></nav>
          
          <!-- Main Content -->
          <main id="main-content" class="home-content">
            <div class="container">
              <!-- Hero Section -->
              <section class="hero-section">
                <div class="hero-content">
                  <h1 class="hero-title">
                    <span class="brand-icon">🌺</span>
                    ${i18n.t('app.name')}
                  </h1>
                  <p class="hero-subtitle">
                    ${i18n.t('app.description')}
                  </p>
                  <p class="hero-tagline">
                    ${i18n.t('app.tagline')}
                  </p>
                </div>
              </section>

              <!-- Features Grid -->
              <section class="features-section">
                <div class="features-grid">
                  <!-- AR Altar Feature -->
                  <div class="feature-card" data-feature="altar">
                    <div class="feature-icon">🕯️</div>
                    <h3>${i18n.t('features.altar.title')}</h3>
                    <p>${i18n.t('features.altar.description')}</p>
                    <button class="btn btn-primary feature-btn" data-route="/altar">
                      ${i18n.t('features.altar.action')}
                    </button>
                  </div>

                  <!-- Memory Book Feature -->
                  <div class="feature-card" data-feature="memories">
                    <div class="feature-icon">📖</div>
                    <h3>${i18n.t('features.memories.title')}</h3>
                    <p>${i18n.t('features.memories.description')}</p>
                    <button class="btn btn-primary feature-btn" data-route="/memories">
                      ${i18n.t('features.memories.action')}
                    </button>
                  </div>

                  <!-- Educational Content Feature -->
                  <div class="feature-card" data-feature="learn">
                    <div class="feature-icon">🎓</div>
                    <h3>${i18n.t('features.learn.title')}</h3>
                    <p>${i18n.t('features.learn.description')}</p>
                    <button class="btn btn-primary feature-btn" data-route="/learn">
                      ${i18n.t('features.learn.action')}
                    </button>
                  </div>

                  <!-- Family Sharing Feature -->
                  <div class="feature-card" data-feature="family">
                    <div class="feature-icon">👨‍👩‍👧‍👦</div>
                    <h3>${i18n.t('features.family.title')}</h3>
                    <p>${i18n.t('features.family.description')}</p>
                    <button class="btn btn-primary feature-btn" data-route="/family">
                      ${i18n.t('features.family.action')}
                    </button>
                  </div>
                </div>
              </section>

              <!-- Quick Stats -->
              <section class="stats-section">
                <div class="stats-grid">
                  <div class="stat-card">
                    <div class="stat-number" id="memorial-count">0</div>
                    <div class="stat-label">${i18n.t('stats.memorials')}</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-number" id="ar-supported">${appState.get('arSession.isSupported') ? '✅' : '❌'}</div>
                    <div class="stat-label">${i18n.t('stats.ar_support')}</div>
                  </div>
                  <div class="stat-card">
                    <div class="stat-number" id="family-members">0</div>
                    <div class="stat-label">${i18n.t('stats.family_members')}</div>
                  </div>
                </div>
              </section>

              <!-- Getting Started -->
              <section class="getting-started-section">
                <h2>${i18n.t('home.getting_started')}</h2>
                <div class="steps-grid">
                  <div class="step-card">
                    <div class="step-number">1</div>
                    <h4>${i18n.t('home.step1.title')}</h4>
                    <p>${i18n.t('home.step1.description')}</p>
                  </div>
                  <div class="step-card">
                    <div class="step-number">2</div>
                    <h4>${i18n.t('home.step2.title')}</h4>
                    <p>${i18n.t('home.step2.description')}</p>
                  </div>
                  <div class="step-card">
                    <div class="step-number">3</div>
                    <h4>${i18n.t('home.step3.title')}</h4>
                    <p>${i18n.t('home.step3.description')}</p>
                  </div>
                </div>
              </section>
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
      
      // Update stats
      this.updateStats()

      console.log('✅ Home View rendered successfully')

    } catch (error) {
      console.error('❌ Failed to render Home View:', error)
      this.showError(error)
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Feature buttons
    const featureButtons = this.container.querySelectorAll('.feature-btn')
    featureButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const route = button.dataset.route
        if (route) {
          router.navigate(route)
        }
      })
    })

    // Feature cards hover effects
    const featureCards = this.container.querySelectorAll('.feature-card')
    featureCards.forEach(card => {
      card.addEventListener('click', () => {
        const button = card.querySelector('.feature-btn')
        if (button) {
          button.click()
        }
      })
    })

    // Listen for memorial count changes
    appState.subscribe('memorials', () => {
      this.updateStats()
    })

    // Listen for family group changes
    appState.subscribe('familyGroup', () => {
      this.updateStats()
    })
  }

  /**
   * Update statistics display
   */
  updateStats() {
    const memorialCount = appState.get('memorials')?.length || 0
    const familyGroup = appState.get('familyGroup')
    const familyMemberCount = familyGroup?.members?.length || 0

    const memorialCountEl = this.container.querySelector('#memorial-count')
    const familyMembersEl = this.container.querySelector('#family-members')

    if (memorialCountEl) {
      memorialCountEl.textContent = memorialCount
    }

    if (familyMembersEl) {
      familyMembersEl.textContent = familyMemberCount
    }
  }

  /**
   * Show error state
   */
  showError(error) {
    this.container.innerHTML = `
      <div class="home-error">
        <div class="container">
          <h2>😔 ${i18n.t('errors.home_load_failed')}</h2>
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
    console.log('🧹 Home View disposed')
  }
}
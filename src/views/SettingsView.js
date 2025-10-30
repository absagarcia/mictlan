/**
 * Settings View - Application settings and preferences
 * User preferences, theme, language, and app configuration
 */

import { appState } from '../state/AppState.js'
import { router } from '../router/Router.js'
import { i18n } from '../i18n/i18n.js'
import { Navigation } from '../components/ui/Navigation.js'
import { Modal } from '../components/ui/Modal.js'
import { tutorialSystem } from '../components/ui/TutorialSystem.js'

export class SettingsView {
  constructor(container) {
    this.container = container
    this.navigation = null
  }

  /**
   * Render settings view
   */
  async render() {
    console.log('⚙️ Rendering Settings View...')

    try {
      this.container.innerHTML = `
        <div class="settings-view">
          <!-- Navigation -->
          <nav id="main-navigation"></nav>
          
          <!-- Main Content -->
          <main id="main-content" class="settings-content">
            <div class="container">
              <!-- Header -->
              <header class="settings-header">
                <div class="header-content">
                  <h1>
                    <span class="header-icon">⚙️</span>
                    ${i18n.t('settings.title')}
                  </h1>
                  <p class="header-subtitle">${i18n.t('settings.subtitle')}</p>
                </div>
              </header>

              <!-- Settings Sections -->
              <div class="settings-sections">
                <!-- General Settings -->
                <section class="settings-section">
                  <h2>${i18n.t('settings.general.title')}</h2>
                  
                  <div class="setting-item">
                    <div class="setting-info">
                      <h3>${i18n.t('settings.general.language')}</h3>
                      <p>${i18n.t('settings.general.language_desc')}</p>
                    </div>
                    <div class="setting-control">
                      <select id="language-select" class="form-select">
                        <option value="es">Español</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>

                  <div class="setting-item">
                    <div class="setting-info">
                      <h3>${i18n.t('settings.general.theme')}</h3>
                      <p>${i18n.t('settings.general.theme_desc')}</p>
                    </div>
                    <div class="setting-control">
                      <select id="theme-select" class="form-select">
                        <option value="auto">${i18n.t('settings.theme.auto')}</option>
                        <option value="light">${i18n.t('settings.theme.light')}</option>
                        <option value="dark">${i18n.t('settings.theme.dark')}</option>
                      </select>
                    </div>
                  </div>

                  <div class="setting-item">
                    <div class="setting-info">
                      <h3>${i18n.t('settings.general.audio')}</h3>
                      <p>${i18n.t('settings.general.audio_desc')}</p>
                    </div>
                    <div class="setting-control">
                      <label class="toggle-switch">
                        <input type="checkbox" id="audio-enabled">
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </section>

                <!-- AR Settings -->
                <section class="settings-section">
                  <h2>${i18n.t('settings.ar.title')}</h2>
                  
                  <div class="setting-item">
                    <div class="setting-info">
                      <h3>${i18n.t('settings.ar.enabled')}</h3>
                      <p>${i18n.t('settings.ar.enabled_desc')}</p>
                    </div>
                    <div class="setting-control">
                      <label class="toggle-switch">
                        <input type="checkbox" id="ar-enabled">
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div class="ar-status">
                    <div class="status-indicator">
                      <span class="status-icon" id="ar-status-icon">❌</span>
                      <span class="status-text" id="ar-status-text">${i18n.t('settings.ar.checking')}</span>
                    </div>
                  </div>
                </section>

                <!-- Privacy Settings -->
                <section class="settings-section">
                  <h2>${i18n.t('settings.privacy.title')}</h2>
                  
                  <div class="setting-item">
                    <div class="setting-info">
                      <h3>${i18n.t('settings.privacy.auto_sync')}</h3>
                      <p>${i18n.t('settings.privacy.auto_sync_desc')}</p>
                    </div>
                    <div class="setting-control">
                      <label class="toggle-switch">
                        <input type="checkbox" id="auto-sync">
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div class="setting-item">
                    <div class="setting-info">
                      <h3>${i18n.t('settings.privacy.conflict_resolution')}</h3>
                      <p>${i18n.t('settings.privacy.conflict_resolution_desc')}</p>
                    </div>
                    <div class="setting-control">
                      <select id="conflict-resolution" class="form-select">
                        <option value="manual">${i18n.t('settings.privacy.manual')}</option>
                        <option value="local">${i18n.t('settings.privacy.prefer_local')}</option>
                        <option value="remote">${i18n.t('settings.privacy.prefer_remote')}</option>
                      </select>
                    </div>
                  </div>
                </section>

                <!-- Export Settings -->
                <section class="settings-section">
                  <h2>${i18n.t('settings.export.title')}</h2>
                  
                  <div class="setting-item">
                    <div class="setting-info">
                      <h3>${i18n.t('settings.export.include_audio')}</h3>
                      <p>${i18n.t('settings.export.include_audio_desc')}</p>
                    </div>
                    <div class="setting-control">
                      <label class="toggle-switch">
                        <input type="checkbox" id="export-audio">
                        <span class="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div class="setting-item">
                    <div class="setting-info">
                      <h3>${i18n.t('settings.export.format')}</h3>
                      <p>${i18n.t('settings.export.format_desc')}</p>
                    </div>
                    <div class="setting-control">
                      <select id="export-format" class="form-select">
                        <option value="pdf">PDF</option>
                        <option value="json">JSON</option>
                      </select>
                    </div>
                  </div>

                  <div class="setting-item">
                    <div class="setting-info">
                      <h3>${i18n.t('settings.export.quality')}</h3>
                      <p>${i18n.t('settings.export.quality_desc')}</p>
                    </div>
                    <div class="setting-control">
                      <select id="export-quality" class="form-select">
                        <option value="high">${i18n.t('settings.export.high')}</option>
                        <option value="medium">${i18n.t('settings.export.medium')}</option>
                        <option value="low">${i18n.t('settings.export.low')}</option>
                      </select>
                    </div>
                  </div>
                </section>

                <!-- Data Management -->
                <section class="settings-section">
                  <h2>${i18n.t('settings.data.title')}</h2>
                  
                  <div class="data-actions">
                    <button class="btn btn-outline" id="export-data-btn">
                      <span>📤</span>
                      ${i18n.t('settings.data.export')}
                    </button>
                    
                    <button class="btn btn-outline" id="import-data-btn">
                      <span>📥</span>
                      ${i18n.t('settings.data.import')}
                    </button>
                    
                    <button class="btn btn-outline btn-warning" id="clear-data-btn">
                      <span>🗑️</span>
                      ${i18n.t('settings.data.clear')}
                    </button>
                  </div>

                  <div class="data-info">
                    <div class="info-item">
                      <span class="info-label">${i18n.t('settings.data.storage_used')}</span>
                      <span class="info-value" id="storage-used">-</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">${i18n.t('settings.data.last_backup')}</span>
                      <span class="info-value" id="last-backup">-</span>
                    </div>
                  </div>
                </section>

                <!-- Help -->
                <section class="settings-section">
                  <h2>${i18n.t('settings.help.title')}</h2>
                  
                  <div class="help-actions">
                    <button class="btn btn-outline" id="restart-tutorial-btn">
                      <span>🎓</span>
                      ${i18n.t('settings.help.restart_tutorial')}
                    </button>
                    
                    <button class="btn btn-outline" id="keyboard-shortcuts-btn">
                      <span>⌨️</span>
                      ${i18n.t('settings.help.keyboard_shortcuts')}
                    </button>
                    
                    <button class="btn btn-outline" id="accessibility-guide-btn">
                      <span>♿</span>
                      ${i18n.t('settings.help.accessibility_guide')}
                    </button>
                  </div>
                </section>

                <!-- About -->
                <section class="settings-section">
                  <h2>${i18n.t('settings.about.title')}</h2>
                  
                  <div class="about-info">
                    <div class="app-info">
                      <h3>Mictla</h3>
                      <p>${i18n.t('app.description')}</p>
                      <p class="version">Version 1.0.0</p>
                    </div>
                    
                    <div class="challenge-info">
                      <h4>${i18n.t('settings.about.challenge')}</h4>
                      <p>${i18n.t('settings.about.challenge_desc')}</p>
                      <div class="challenge-tags">
                        <span class="tag">#JSConfMX</span>
                        <span class="tag">#CodeOfTheDead</span>
                        <span class="tag">#DíaDeMuertos</span>
                        <span class="tag">#Kiro</span>
                      </div>
                    </div>
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
      
      // Load current settings
      this.loadCurrentSettings()
      
      // Check AR support
      this.checkARSupport()
      
      // Calculate storage usage
      this.calculateStorageUsage()

      console.log('✅ Settings View rendered successfully')

    } catch (error) {
      console.error('❌ Failed to render Settings View:', error)
      this.showError(error)
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Language selection
    const languageSelect = this.container.querySelector('#language-select')
    languageSelect?.addEventListener('change', (e) => {
      appState.actions.setLanguage(e.target.value)
      // Reload page to apply language changes
      setTimeout(() => window.location.reload(), 500)
    })

    // Theme selection
    const themeSelect = this.container.querySelector('#theme-select')
    themeSelect?.addEventListener('change', (e) => {
      appState.set('ui.theme', e.target.value)
      this.applyTheme(e.target.value)
    })

    // Audio enabled
    const audioEnabled = this.container.querySelector('#audio-enabled')
    audioEnabled?.addEventListener('change', (e) => {
      appState.set('user.audioEnabled', e.target.checked)
    })

    // AR enabled
    const arEnabled = this.container.querySelector('#ar-enabled')
    arEnabled?.addEventListener('change', (e) => {
      appState.set('user.arEnabled', e.target.checked)
    })

    // Auto sync
    const autoSync = this.container.querySelector('#auto-sync')
    autoSync?.addEventListener('change', (e) => {
      appState.set('user.syncSettings.autoSync', e.target.checked)
    })

    // Conflict resolution
    const conflictResolution = this.container.querySelector('#conflict-resolution')
    conflictResolution?.addEventListener('change', (e) => {
      appState.set('user.syncSettings.conflictResolution', e.target.value)
    })

    // Export settings
    const exportAudio = this.container.querySelector('#export-audio')
    exportAudio?.addEventListener('change', (e) => {
      appState.set('user.exportSettings.includeAudio', e.target.checked)
    })

    const exportFormat = this.container.querySelector('#export-format')
    exportFormat?.addEventListener('change', (e) => {
      appState.set('user.exportSettings.format', e.target.value)
    })

    const exportQuality = this.container.querySelector('#export-quality')
    exportQuality?.addEventListener('change', (e) => {
      appState.set('user.exportSettings.quality', e.target.value)
    })

    // Data management buttons
    const exportDataBtn = this.container.querySelector('#export-data-btn')
    exportDataBtn?.addEventListener('click', () => {
      this.exportData()
    })

    const importDataBtn = this.container.querySelector('#import-data-btn')
    importDataBtn?.addEventListener('click', () => {
      this.importData()
    })

    const clearDataBtn = this.container.querySelector('#clear-data-btn')
    clearDataBtn?.addEventListener('click', () => {
      this.showClearDataConfirmation()
    })

    // Help buttons
    const restartTutorialBtn = this.container.querySelector('#restart-tutorial-btn')
    restartTutorialBtn?.addEventListener('click', () => {
      this.restartTutorial()
    })

    const keyboardShortcutsBtn = this.container.querySelector('#keyboard-shortcuts-btn')
    keyboardShortcutsBtn?.addEventListener('click', () => {
      this.showKeyboardShortcuts()
    })

    const accessibilityGuideBtn = this.container.querySelector('#accessibility-guide-btn')
    accessibilityGuideBtn?.addEventListener('click', () => {
      this.showAccessibilityGuide()
    })
  }

  /**
   * Load current settings into form
   */
  loadCurrentSettings() {
    const user = appState.get('user')
    const ui = appState.get('ui')

    // Language
    const languageSelect = this.container.querySelector('#language-select')
    if (languageSelect) {
      languageSelect.value = user.language || 'es'
    }

    // Theme
    const themeSelect = this.container.querySelector('#theme-select')
    if (themeSelect) {
      themeSelect.value = ui.theme || 'auto'
    }

    // Audio
    const audioEnabled = this.container.querySelector('#audio-enabled')
    if (audioEnabled) {
      audioEnabled.checked = user.audioEnabled !== false
    }

    // AR
    const arEnabled = this.container.querySelector('#ar-enabled')
    if (arEnabled) {
      arEnabled.checked = user.arEnabled !== false
    }

    // Sync settings
    const autoSync = this.container.querySelector('#auto-sync')
    if (autoSync) {
      autoSync.checked = user.syncSettings?.autoSync !== false
    }

    const conflictResolution = this.container.querySelector('#conflict-resolution')
    if (conflictResolution) {
      conflictResolution.value = user.syncSettings?.conflictResolution || 'manual'
    }

    // Export settings
    const exportAudio = this.container.querySelector('#export-audio')
    if (exportAudio) {
      exportAudio.checked = user.exportSettings?.includeAudio !== false
    }

    const exportFormat = this.container.querySelector('#export-format')
    if (exportFormat) {
      exportFormat.value = user.exportSettings?.format || 'pdf'
    }

    const exportQuality = this.container.querySelector('#export-quality')
    if (exportQuality) {
      exportQuality.value = user.exportSettings?.quality || 'medium'
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
   * Check AR support
   */
  async checkARSupport() {
    const statusIcon = this.container.querySelector('#ar-status-icon')
    const statusText = this.container.querySelector('#ar-status-text')

    try {
      if ('xr' in navigator) {
        const supported = await navigator.xr.isSessionSupported('immersive-ar')
        
        if (supported) {
          statusIcon.textContent = '✅'
          statusText.textContent = i18n.t('settings.ar.supported')
          appState.set('arSession.isSupported', true)
        } else {
          statusIcon.textContent = '⚠️'
          statusText.textContent = i18n.t('settings.ar.not_supported')
          appState.set('arSession.isSupported', false)
        }
      } else {
        statusIcon.textContent = '❌'
        statusText.textContent = i18n.t('settings.ar.not_available')
        appState.set('arSession.isSupported', false)
      }
    } catch (error) {
      console.error('AR support check failed:', error)
      statusIcon.textContent = '❌'
      statusText.textContent = i18n.t('settings.ar.check_failed')
      appState.set('arSession.isSupported', false)
    }
  }

  /**
   * Calculate storage usage
   */
  calculateStorageUsage() {
    try {
      const data = localStorage.getItem('mictla-app-state')
      const sizeInBytes = new Blob([data || '']).size
      const sizeInKB = Math.round(sizeInBytes / 1024)
      
      const storageUsed = this.container.querySelector('#storage-used')
      if (storageUsed) {
        storageUsed.textContent = `${sizeInKB} KB`
      }

      // Last backup (for now, just show last save time)
      const lastBackup = this.container.querySelector('#last-backup')
      if (lastBackup) {
        const lastSave = appState.get('user.lastVisit')
        if (lastSave) {
          lastBackup.textContent = new Date(lastSave).toLocaleString()
        } else {
          lastBackup.textContent = i18n.t('settings.data.never')
        }
      }

    } catch (error) {
      console.error('Failed to calculate storage usage:', error)
    }
  }

  /**
   * Export data
   */
  exportData() {
    try {
      const data = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        memorials: appState.get('memorials') || [],
        user: appState.get('user') || {},
        familyGroup: appState.get('familyGroup') || null
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `mictla-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      URL.revokeObjectURL(url)

      appState.actions.showNotification({
        type: 'success',
        title: i18n.t('settings.data.export_success'),
        message: i18n.t('settings.data.export_success_message')
      })

    } catch (error) {
      console.error('Failed to export data:', error)
      appState.actions.showNotification({
        type: 'error',
        title: i18n.t('settings.data.export_failed'),
        message: error.message
      })
    }
  }

  /**
   * Import data
   */
  importData() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)

        // Validate data structure
        if (!data.version || !data.memorials) {
          throw new Error(i18n.t('settings.data.invalid_format'))
        }

        // Show confirmation modal
        const modal = new Modal({
          title: i18n.t('settings.data.import_confirm'),
          content: `
            <div class="import-preview">
              <p>${i18n.t('settings.data.import_confirm_message')}</p>
              <ul>
                <li>${i18n.t('settings.data.memorials')}: ${data.memorials.length}</li>
                <li>${i18n.t('settings.data.export_date')}: ${new Date(data.exportDate).toLocaleString()}</li>
                <li>${i18n.t('settings.data.version')}: ${data.version}</li>
              </ul>
              <p class="warning">${i18n.t('settings.data.import_warning')}</p>
            </div>
          `,
          onConfirm: () => {
            this.performImport(data)
            modal.hide()
          }
        })

        modal.show()

      } catch (error) {
        console.error('Failed to import data:', error)
        appState.actions.showNotification({
          type: 'error',
          title: i18n.t('settings.data.import_failed'),
          message: error.message
        })
      }
    }

    input.click()
  }

  /**
   * Perform data import
   */
  performImport(data) {
    try {
      // Import memorials
      if (data.memorials && Array.isArray(data.memorials)) {
        appState.set('memorials', data.memorials)
      }

      // Import user settings (merge with current)
      if (data.user) {
        const currentUser = appState.get('user')
        appState.set('user', { ...currentUser, ...data.user })
      }

      // Import family group
      if (data.familyGroup) {
        appState.set('familyGroup', data.familyGroup)
      }

      appState.actions.showNotification({
        type: 'success',
        title: i18n.t('settings.data.import_success'),
        message: i18n.t('settings.data.import_success_message')
      })

      // Refresh the page to apply changes
      setTimeout(() => window.location.reload(), 1000)

    } catch (error) {
      console.error('Failed to perform import:', error)
      appState.actions.showNotification({
        type: 'error',
        title: i18n.t('settings.data.import_failed'),
        message: error.message
      })
    }
  }

  /**
   * Show clear data confirmation
   */
  showClearDataConfirmation() {
    const modal = new Modal({
      title: i18n.t('settings.data.clear_confirm'),
      content: `
        <div class="clear-data-warning">
          <p>${i18n.t('settings.data.clear_warning')}</p>
          <p><strong>${i18n.t('settings.data.clear_irreversible')}</strong></p>
          <p>${i18n.t('settings.data.clear_recommendation')}</p>
        </div>
      `,
      onConfirm: () => {
        this.clearAllData()
        modal.hide()
      }
    })

    modal.show()
  }

  /**
   * Clear all data
   */
  clearAllData() {
    try {
      // Clear localStorage
      localStorage.removeItem('mictla-app-state')
      
      // Reset app state to defaults
      appState.set('memorials', [])
      appState.set('familyGroup', null)
      
      appState.actions.showNotification({
        type: 'success',
        title: i18n.t('settings.data.clear_success'),
        message: i18n.t('settings.data.clear_success_message')
      })

      // Refresh the page
      setTimeout(() => window.location.reload(), 1000)

    } catch (error) {
      console.error('Failed to clear data:', error)
      appState.actions.showNotification({
        type: 'error',
        title: i18n.t('settings.data.clear_failed'),
        message: error.message
      })
    }
  }

  /**
   * Restart tutorial
   */
  restartTutorial() {
    const modal = new Modal({
      title: i18n.t('settings.help.restart_tutorial'),
      content: `
        <div class="restart-tutorial-modal">
          <p>${i18n.t('settings.help.restart_tutorial_desc')}</p>
          <p><strong>${i18n.t('settings.help.restart_tutorial_warning')}</strong></p>
        </div>
      `,
      onConfirm: () => {
        tutorialSystem.restartTutorial()
        modal.hide()
      }
    })

    modal.show()
  }

  /**
   * Show keyboard shortcuts
   */
  showKeyboardShortcuts() {
    const modal = new Modal({
      title: i18n.t('settings.help.keyboard_shortcuts'),
      size: 'large',
      content: `
        <div class="keyboard-shortcuts-modal">
          <div class="shortcuts-section">
            <h4>${i18n.t('settings.help.navigation_shortcuts')}</h4>
            <div class="shortcut-list">
              <div class="shortcut-item">
                <kbd>Tab</kbd>
                <span>${i18n.t('settings.help.navigate_elements')}</span>
              </div>
              <div class="shortcut-item">
                <kbd>Enter</kbd> / <kbd>Space</kbd>
                <span>${i18n.t('settings.help.activate_element')}</span>
              </div>
              <div class="shortcut-item">
                <kbd>Escape</kbd>
                <span>${i18n.t('settings.help.close_modal')}</span>
              </div>
              <div class="shortcut-item">
                <kbd>Arrow Keys</kbd>
                <span>${i18n.t('settings.help.navigate_tutorial')}</span>
              </div>
            </div>
          </div>
          
          <div class="shortcuts-section">
            <h4>${i18n.t('settings.help.app_shortcuts')}</h4>
            <div class="shortcut-list">
              <div class="shortcut-item">
                <kbd>Alt</kbd> + <kbd>H</kbd>
                <span>${i18n.t('settings.help.go_home')}</span>
              </div>
              <div class="shortcut-item">
                <kbd>Alt</kbd> + <kbd>M</kbd>
                <span>${i18n.t('settings.help.go_memories')}</span>
              </div>
              <div class="shortcut-item">
                <kbd>Alt</kbd> + <kbd>A</kbd>
                <span>${i18n.t('settings.help.go_altar')}</span>
              </div>
              <div class="shortcut-item">
                <kbd>Alt</kbd> + <kbd>F</kbd>
                <span>${i18n.t('settings.help.go_family')}</span>
              </div>
            </div>
          </div>
        </div>
      `
    })

    modal.show()
  }

  /**
   * Show accessibility guide
   */
  showAccessibilityGuide() {
    const modal = new Modal({
      title: i18n.t('settings.help.accessibility_guide'),
      size: 'large',
      content: `
        <div class="accessibility-guide-modal">
          <div class="guide-section">
            <h4>${i18n.t('settings.help.screen_reader_support')}</h4>
            <ul>
              <li>${i18n.t('settings.help.aria_labels')}</li>
              <li>${i18n.t('settings.help.semantic_html')}</li>
              <li>${i18n.t('settings.help.live_regions')}</li>
              <li>${i18n.t('settings.help.focus_management')}</li>
            </ul>
          </div>
          
          <div class="guide-section">
            <h4>${i18n.t('settings.help.keyboard_navigation')}</h4>
            <ul>
              <li>${i18n.t('settings.help.tab_navigation')}</li>
              <li>${i18n.t('settings.help.skip_links')}</li>
              <li>${i18n.t('settings.help.focus_indicators')}</li>
              <li>${i18n.t('settings.help.keyboard_shortcuts')}</li>
            </ul>
          </div>
          
          <div class="guide-section">
            <h4>${i18n.t('settings.help.visual_accessibility')}</h4>
            <ul>
              <li>${i18n.t('settings.help.high_contrast')}</li>
              <li>${i18n.t('settings.help.color_contrast')}</li>
              <li>${i18n.t('settings.help.font_scaling')}</li>
              <li>${i18n.t('settings.help.reduced_motion')}</li>
            </ul>
          </div>
          
          <div class="guide-section">
            <h4>${i18n.t('settings.help.mobile_accessibility')}</h4>
            <ul>
              <li>${i18n.t('settings.help.touch_targets')}</li>
              <li>${i18n.t('settings.help.voice_control')}</li>
              <li>${i18n.t('settings.help.gesture_alternatives')}</li>
            </ul>
          </div>
        </div>
      `
    })

    modal.show()
  }

  /**
   * Show error state
   */
  showError(error) {
    this.container.innerHTML = `
      <div class="settings-error">
        <div class="container">
          <h2>😔 ${i18n.t('errors.settings_load_failed')}</h2>
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
    console.log('🧹 Settings View disposed')
  }
}
/**
 * Mictla App State Management
 * Reactive state pattern for managing global application state
 */

class AppState {
  constructor() {
    this.state = {
      // User preferences and settings
      user: {
        userId: this.generateUserId(),
        language: this.detectLanguage(),
        arEnabled: this.detectARSupport(),
        audioEnabled: true,
        tutorialCompleted: false,
        lastVisit: new Date(),
        familyGroup: null,
        syncSettings: {
          autoSync: true,
          lastSyncTime: null,
          conflictResolution: 'manual'
        },
        exportSettings: {
          includeAudio: true,
          format: 'pdf',
          quality: 'medium'
        }
      },

      // Memorial data
      memorials: [],
      
      // Family sharing
      familyGroup: null,

      // AR session state
      arSession: {
        isActive: false,
        isSupported: false,
        camera: null,
        scene: null,
        offerings: []
      },

      // UI state
      ui: {
        currentView: 'home',
        loading: false,
        modals: [],
        notifications: [],
        theme: 'auto' // 'light', 'dark', 'auto'
      },

      // Sync state
      sync: {
        status: 'idle', // 'idle', 'syncing', 'error'
        lastSync: null,
        pendingChanges: []
      }
    }

    // Observers for reactive updates
    this.observers = new Map()
    
    // Initialize from storage
    this.loadFromStorage()
    
    // Auto-save on changes
    this.setupAutoSave()
  }

  /**
   * Subscribe to state changes
   * @param {string} path - State path to observe (e.g., 'user.language', 'memorials')
   * @param {Function} callback - Callback function to execute on change
   * @returns {Function} Unsubscribe function
   */
  subscribe(path, callback) {
    if (!this.observers.has(path)) {
      this.observers.set(path, new Set())
    }
    
    this.observers.get(path).add(callback)
    
    // Return unsubscribe function
    return () => {
      const pathObservers = this.observers.get(path)
      if (pathObservers) {
        pathObservers.delete(callback)
        if (pathObservers.size === 0) {
          this.observers.delete(path)
        }
      }
    }
  }

  /**
   * Get state value by path
   * @param {string} path - Dot notation path (e.g., 'user.language')
   * @returns {any} State value
   */
  get(path) {
    return this.getNestedValue(this.state, path)
  }

  /**
   * Set state value by path
   * @param {string} path - Dot notation path
   * @param {any} value - New value
   */
  set(path, value) {
    const oldValue = this.get(path)
    this.setNestedValue(this.state, path, value)
    
    // Notify observers
    this.notifyObservers(path, value, oldValue)
    
    // Auto-save
    this.saveToStorage()
  }

  /**
   * Update state with partial object
   * @param {string} path - Path to update
   * @param {Object} updates - Partial updates
   */
  update(path, updates) {
    const current = this.get(path) || {}
    const newValue = { ...current, ...updates }
    this.set(path, newValue)
  }

  /**
   * Add item to array state
   * @param {string} path - Path to array
   * @param {any} item - Item to add
   */
  push(path, item) {
    const array = this.get(path) || []
    this.set(path, [...array, item])
  }

  /**
   * Remove item from array state
   * @param {string} path - Path to array
   * @param {Function|any} predicate - Function or value to match
   */
  remove(path, predicate) {
    const array = this.get(path) || []
    const newArray = typeof predicate === 'function' 
      ? array.filter(item => !predicate(item))
      : array.filter(item => item !== predicate)
    this.set(path, newArray)
  }

  // Helper methods
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.')
    const lastKey = keys.pop()
    const target = keys.reduce((current, key) => {
      if (!(key in current)) current[key] = {}
      return current[key]
    }, obj)
    target[lastKey] = value
  }

  notifyObservers(path, newValue, oldValue) {
    // Notify exact path observers
    const pathObservers = this.observers.get(path)
    if (pathObservers) {
      pathObservers.forEach(callback => {
        try {
          callback(newValue, oldValue, path)
        } catch (error) {
          console.error('Observer callback error:', error)
        }
      })
    }

    // Notify parent path observers
    const pathParts = path.split('.')
    for (let i = pathParts.length - 1; i > 0; i--) {
      const parentPath = pathParts.slice(0, i).join('.')
      const parentObservers = this.observers.get(parentPath)
      if (parentObservers) {
        const parentValue = this.get(parentPath)
        parentObservers.forEach(callback => {
          try {
            callback(parentValue, parentValue, parentPath)
          } catch (error) {
            console.error('Parent observer callback error:', error)
          }
        })
      }
    }
  }

  // Storage methods
  async loadFromStorage() {
    try {
      const stored = localStorage.getItem('mictla-app-state')
      if (stored) {
        const parsedState = JSON.parse(stored)
        // Merge with default state to handle new properties
        this.state = this.deepMerge(this.state, parsedState)
      }
    } catch (error) {
      console.error('Failed to load state from storage:', error)
    }
  }

  async saveToStorage() {
    try {
      localStorage.setItem('mictla-app-state', JSON.stringify(this.state))
    } catch (error) {
      console.error('Failed to save state to storage:', error)
    }
  }

  setupAutoSave() {
    // Debounced save to avoid excessive writes
    let saveTimeout
    const debouncedSave = () => {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => this.saveToStorage(), 1000)
    }

    // Save on any state change
    this.subscribe('', debouncedSave)
  }

  deepMerge(target, source) {
    const result = { ...target }
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }
    
    return result
  }

  // Utility methods
  generateUserId() {
    return 'user_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now()
  }

  detectLanguage() {
    const browserLang = navigator.language || navigator.userLanguage
    return browserLang.startsWith('es') ? 'es' : 'en'
  }

  async detectARSupport() {
    if ('xr' in navigator) {
      try {
        const supported = await navigator.xr.isSessionSupported('immersive-ar')
        return supported
      } catch (error) {
        console.log('AR support detection failed:', error)
        return false
      }
    }
    return false
  }

  // Action methods for common operations
  actions = {
    // User actions
    setLanguage: (language) => {
      this.set('user.language', language)
      document.documentElement.lang = language
    },

    toggleTheme: () => {
      const current = this.get('ui.theme')
      const next = current === 'light' ? 'dark' : 'light'
      this.set('ui.theme', next)
      document.documentElement.setAttribute('data-theme', next)
    },

    // UI actions
    setCurrentView: (view) => {
      this.set('ui.currentView', view)
      // Update URL without page reload
      if (window.history) {
        const url = view === 'home' ? '/' : `/${view}`
        window.history.pushState({ view }, '', url)
      }
    },

    setLoading: (loading) => {
      this.set('ui.loading', loading)
    },

    showNotification: (notification) => {
      const notifications = this.get('ui.notifications') || []
      const newNotification = {
        id: Date.now(),
        timestamp: new Date(),
        ...notification
      }
      this.set('ui.notifications', [...notifications, newNotification])
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        this.actions.removeNotification(newNotification.id)
      }, 5000)
    },

    removeNotification: (id) => {
      this.remove('ui.notifications', notification => notification.id === id)
    },

    // Memorial actions
    addMemorial: (memorial) => {
      const newMemorial = {
        id: 'memorial_' + Date.now(),
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: 'local',
        ...memorial
      }
      this.push('memorials', newMemorial)
      return newMemorial
    },

    updateMemorial: (id, updates) => {
      const memorials = this.get('memorials') || []
      const index = memorials.findIndex(m => m.id === id)
      if (index !== -1) {
        const updated = {
          ...memorials[index],
          ...updates,
          updatedAt: new Date(),
          syncStatus: 'pending'
        }
        const newMemorials = [...memorials]
        newMemorials[index] = updated
        this.set('memorials', newMemorials)
        return updated
      }
      return null
    },

    removeMemorial: (id) => {
      this.remove('memorials', memorial => memorial.id === id)
    },

    // AR actions
    startARSession: () => {
      this.update('arSession', {
        isActive: true
      })
    },

    endARSession: () => {
      this.update('arSession', {
        isActive: false,
        camera: null,
        scene: null
      })
    }
  }
}

// Create singleton instance
export const appState = new AppState()

// Export class for testing
export { AppState }
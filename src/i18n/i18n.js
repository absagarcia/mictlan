/**
 * Mictla Internationalization System
 * Supports Spanish and English with reactive language switching
 */

import { appState } from '../state/AppState.js'
import esTranslations from './es.json'
import enTranslations from './en.json'

class I18n {
  constructor() {
    this.translations = {
      es: esTranslations,
      en: enTranslations
    }
    
    this.currentLanguage = 'es'
    this.fallbackLanguage = 'es'
    
    // Initialize from app state
    this.init()
  }

  /**
   * Initialize i18n system
   */
  init() {
    // Get language from app state
    const savedLanguage = appState.get('user.language')
    if (savedLanguage && this.translations[savedLanguage]) {
      this.currentLanguage = savedLanguage
    }
    
    // Set document language
    document.documentElement.lang = this.currentLanguage
    
    // Listen for language changes
    appState.subscribe('user.language', (newLanguage) => {
      this.setLanguage(newLanguage)
    })
    
    // Update page content on language change
    this.updatePageContent()
  }

  /**
   * Set current language
   * @param {string} language - Language code (es, en)
   */
  setLanguage(language) {
    if (!this.translations[language]) {
      console.warn(`Language '${language}' not supported, falling back to '${this.fallbackLanguage}'`)
      language = this.fallbackLanguage
    }
    
    this.currentLanguage = language
    document.documentElement.lang = language
    
    // Update page content
    this.updatePageContent()
    
    // Dispatch language change event
    window.dispatchEvent(new CustomEvent('languagechange', {
      detail: { language }
    }))
  }

  /**
   * Get current language
   * @returns {string} Current language code
   */
  getLanguage() {
    return this.currentLanguage
  }

  /**
   * Get available languages
   * @returns {Array} Available language codes
   */
  getAvailableLanguages() {
    return Object.keys(this.translations)
  }

  /**
   * Translate a key
   * @param {string} key - Translation key (dot notation)
   * @param {Object} params - Parameters for interpolation
   * @param {string} language - Override language
   * @returns {string} Translated text
   */
  t(key, params = {}, language = null) {
    const lang = language || this.currentLanguage
    const translation = this.getNestedValue(this.translations[lang], key)
    
    if (translation === undefined) {
      // Try fallback language
      if (lang !== this.fallbackLanguage) {
        const fallbackTranslation = this.getNestedValue(this.translations[this.fallbackLanguage], key)
        if (fallbackTranslation !== undefined) {
          return this.interpolate(fallbackTranslation, params)
        }
      }
      
      console.warn(`Translation missing for key: ${key}`)
      return key
    }
    
    return this.interpolate(translation, params)
  }

  /**
   * Get nested value from object using dot notation
   * @param {Object} obj - Object to search
   * @param {string} key - Dot notation key
   * @returns {any} Value or undefined
   */
  getNestedValue(obj, key) {
    return key.split('.').reduce((current, keyPart) => {
      return current && current[keyPart]
    }, obj)
  }

  /**
   * Interpolate parameters in translation string
   * @param {string} text - Text with placeholders
   * @param {Object} params - Parameters to interpolate
   * @returns {string} Interpolated text
   */
  interpolate(text, params) {
    if (typeof text !== 'string') return text
    
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match
    })
  }

  /**
   * Pluralize translation based on count
   * @param {string} key - Translation key
   * @param {number} count - Count for pluralization
   * @param {Object} params - Additional parameters
   * @returns {string} Pluralized translation
   */
  tp(key, count, params = {}) {
    const pluralKey = count === 1 ? `${key}.singular` : `${key}.plural`
    const translation = this.t(pluralKey, { ...params, count })
    
    // If plural key doesn't exist, try the base key
    if (translation === pluralKey) {
      return this.t(key, { ...params, count })
    }
    
    return translation
  }

  /**
   * Format date according to current language
   * @param {Date} date - Date to format
   * @param {Object} options - Intl.DateTimeFormat options
   * @returns {string} Formatted date
   */
  formatDate(date, options = {}) {
    const locale = this.currentLanguage === 'es' ? 'es-MX' : 'en-US'
    return new Intl.DateTimeFormat(locale, options).format(date)
  }

  /**
   * Format number according to current language
   * @param {number} number - Number to format
   * @param {Object} options - Intl.NumberFormat options
   * @returns {string} Formatted number
   */
  formatNumber(number, options = {}) {
    const locale = this.currentLanguage === 'es' ? 'es-MX' : 'en-US'
    return new Intl.NumberFormat(locale, options).format(number)
  }

  /**
   * Format currency according to current language
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code (default: MXN for es, USD for en)
   * @returns {string} Formatted currency
   */
  formatCurrency(amount, currency = null) {
    const locale = this.currentLanguage === 'es' ? 'es-MX' : 'en-US'
    const defaultCurrency = this.currentLanguage === 'es' ? 'MXN' : 'USD'
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || defaultCurrency
    }).format(amount)
  }

  /**
   * Get relative time format
   * @param {Date} date - Date to format
   * @returns {string} Relative time string
   */
  formatRelativeTime(date) {
    const locale = this.currentLanguage === 'es' ? 'es-MX' : 'en-US'
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    
    const now = new Date()
    const diffInSeconds = Math.floor((date - now) / 1000)
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)
    
    if (Math.abs(diffInDays) >= 1) {
      return rtf.format(diffInDays, 'day')
    } else if (Math.abs(diffInHours) >= 1) {
      return rtf.format(diffInHours, 'hour')
    } else if (Math.abs(diffInMinutes) >= 1) {
      return rtf.format(diffInMinutes, 'minute')
    } else {
      return rtf.format(diffInSeconds, 'second')
    }
  }

  /**
   * Update page content with current language
   */
  updatePageContent() {
    // Update elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]')
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n')
      const translation = this.t(key)
      
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.placeholder = translation
      } else {
        element.textContent = translation
      }
    })
    
    // Update elements with data-i18n-html attribute (for HTML content)
    const htmlElements = document.querySelectorAll('[data-i18n-html]')
    htmlElements.forEach(element => {
      const key = element.getAttribute('data-i18n-html')
      const translation = this.t(key)
      element.innerHTML = translation
    })
    
    // Update title and meta description
    const titleKey = document.documentElement.getAttribute('data-i18n-title')
    if (titleKey) {
      document.title = this.t(titleKey)
    }
    
    const descriptionMeta = document.querySelector('meta[name="description"]')
    const descriptionKey = descriptionMeta?.getAttribute('data-i18n')
    if (descriptionKey && descriptionMeta) {
      descriptionMeta.content = this.t(descriptionKey)
    }
  }

  /**
   * Create a reactive translation function for components
   * @param {HTMLElement} element - Element to update
   * @returns {Function} Translation function
   */
  createReactiveTranslator(element) {
    const updateElement = () => {
      this.updatePageContent()
    }
    
    // Listen for language changes
    window.addEventListener('languagechange', updateElement)
    
    // Return cleanup function
    return () => {
      window.removeEventListener('languagechange', updateElement)
    }
  }

  /**
   * Get language direction (for RTL support in future)
   * @param {string} language - Language code
   * @returns {string} 'ltr' or 'rtl'
   */
  getLanguageDirection(language = null) {
    const lang = language || this.currentLanguage
    // All supported languages are LTR for now
    return 'ltr'
  }

  /**
   * Check if language is supported
   * @param {string} language - Language code to check
   * @returns {boolean} Whether language is supported
   */
  isLanguageSupported(language) {
    return this.translations.hasOwnProperty(language)
  }

  /**
   * Load additional translations dynamically
   * @param {string} language - Language code
   * @param {Object} translations - Translation object
   */
  addTranslations(language, translations) {
    if (!this.translations[language]) {
      this.translations[language] = {}
    }
    
    this.translations[language] = {
      ...this.translations[language],
      ...translations
    }
  }

  /**
   * Get all translations for a language (for debugging)
   * @param {string} language - Language code
   * @returns {Object} All translations
   */
  getAllTranslations(language = null) {
    const lang = language || this.currentLanguage
    return this.translations[lang] || {}
  }
}

// Create singleton instance
export const i18n = new I18n()

// Export class for testing
export { I18n }

// Convenience function for templates
export const t = (key, params, language) => i18n.t(key, params, language)
export const tp = (key, count, params) => i18n.tp(key, count, params)
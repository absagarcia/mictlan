/**
 * Accessibility Utilities
 * Provides accessibility features and helpers for the application
 */

export class AccessibilityManager {
  constructor() {
    this.announcer = null
    this.focusHistory = []
    this.keyboardNavigation = new Map()
    this.highContrastMode = false
    this.reducedMotion = false
    this.screenReaderMode = false
  }

  /**
   * Initialize accessibility features
   */
  init() {
    console.log('♿ Initializing Accessibility Manager...')

    // Create screen reader announcer
    this.createScreenReaderAnnouncer()

    // Detect user preferences
    this.detectUserPreferences()

    // Setup global keyboard navigation
    this.setupGlobalKeyboardNavigation()

    // Setup focus management
    this.setupFocusManagement()

    // Apply initial accessibility settings
    this.applyAccessibilitySettings()

    console.log('✅ Accessibility Manager initialized')
  }

  /**
   * Create hidden element for screen reader announcements
   */
  createScreenReaderAnnouncer() {
    this.announcer = document.createElement('div')
    this.announcer.id = 'sr-announcer'
    this.announcer.setAttribute('aria-live', 'polite')
    this.announcer.setAttribute('aria-atomic', 'true')
    this.announcer.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `
    document.body.appendChild(this.announcer)
  }

  /**
   * Announce message to screen readers
   */
  announce(message, priority = 'polite') {
    if (!this.announcer) return

    this.announcer.setAttribute('aria-live', priority)
    this.announcer.textContent = message

    // Clear after announcement
    setTimeout(() => {
      this.announcer.textContent = ''
    }, 1000)
  }

  /**
   * Detect user accessibility preferences
   */
  detectUserPreferences() {
    // High contrast mode
    this.highContrastMode = window.matchMedia('(prefers-contrast: high)').matches

    // Reduced motion
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Screen reader detection (heuristic)
    this.screenReaderMode = this.detectScreenReader()

    // Listen for changes
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.highContrastMode = e.matches
      this.applyAccessibilitySettings()
    })

    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.reducedMotion = e.matches
      this.applyAccessibilitySettings()
    })
  }

  /**
   * Detect screen reader (heuristic approach)
   */
  detectScreenReader() {
    // Check for common screen reader indicators
    const indicators = [
      navigator.userAgent.includes('NVDA'),
      navigator.userAgent.includes('JAWS'),
      navigator.userAgent.includes('VoiceOver'),
      window.speechSynthesis && window.speechSynthesis.getVoices().length > 0,
      document.documentElement.hasAttribute('data-whatinput') && 
      document.documentElement.getAttribute('data-whatinput') === 'keyboard'
    ]

    return indicators.some(indicator => indicator)
  }

  /**
   * Apply accessibility settings to the document
   */
  applyAccessibilitySettings() {
    const root = document.documentElement

    // High contrast mode
    if (this.highContrastMode) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Reduced motion
    if (this.reducedMotion) {
      root.classList.add('reduced-motion')
    } else {
      root.classList.remove('reduced-motion')
    }

    // Screen reader mode
    if (this.screenReaderMode) {
      root.classList.add('screen-reader')
    } else {
      root.classList.remove('screen-reader')
    }
  }

  /**
   * Setup global keyboard navigation
   */
  setupGlobalKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Skip navigation
      if (e.key === 'Tab' && e.ctrlKey) {
        e.preventDefault()
        this.skipToMainContent()
        return
      }

      // Escape key handling
      if (e.key === 'Escape') {
        this.handleEscapeKey()
        return
      }

      // Arrow key navigation for custom components
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        this.handleArrowKeyNavigation(e)
      }
    })
  }

  /**
   * Setup focus management
   */
  setupFocusManagement() {
    // Track focus history
    document.addEventListener('focusin', (e) => {
      this.focusHistory.push(e.target)
      if (this.focusHistory.length > 10) {
        this.focusHistory.shift()
      }
    })

    // Add focus indicators for keyboard users
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation')
      }
    })

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation')
    })
  }

  /**
   * Skip to main content
   */
  skipToMainContent() {
    const mainContent = document.querySelector('main, [role="main"], #main-content')
    if (mainContent) {
      mainContent.focus()
      this.announce('Saltando al contenido principal')
    }
  }

  /**
   * Handle escape key press
   */
  handleEscapeKey() {
    // Close modals
    const openModal = document.querySelector('.modal:not(.closing)')
    if (openModal) {
      const closeButton = openModal.querySelector('.close-button, .close-modal-btn')
      if (closeButton) {
        closeButton.click()
      }
      return
    }

    // Close dropdowns
    const openDropdown = document.querySelector('.dropdown.open')
    if (openDropdown) {
      openDropdown.classList.remove('open')
      return
    }

    // Return focus to previous element
    if (this.focusHistory.length > 1) {
      const previousElement = this.focusHistory[this.focusHistory.length - 2]
      if (previousElement && document.contains(previousElement)) {
        previousElement.focus()
      }
    }
  }

  /**
   * Handle arrow key navigation
   */
  handleArrowKeyNavigation(e) {
    const activeElement = document.activeElement
    const parent = activeElement.closest('[data-keyboard-navigation]')
    
    if (!parent) return

    const navigationType = parent.dataset.keyboardNavigation
    const focusableElements = parent.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return

    const currentIndex = Array.from(focusableElements).indexOf(activeElement)
    let nextIndex = currentIndex

    switch (navigationType) {
      case 'grid':
        nextIndex = this.calculateGridNavigation(e.key, currentIndex, focusableElements, parent)
        break
      case 'list':
        if (e.key === 'ArrowDown') {
          nextIndex = (currentIndex + 1) % focusableElements.length
        } else if (e.key === 'ArrowUp') {
          nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1
        }
        break
      case 'horizontal':
        if (e.key === 'ArrowRight') {
          nextIndex = (currentIndex + 1) % focusableElements.length
        } else if (e.key === 'ArrowLeft') {
          nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1
        }
        break
    }

    if (nextIndex !== currentIndex) {
      e.preventDefault()
      focusableElements[nextIndex].focus()
    }
  }

  /**
   * Calculate grid navigation
   */
  calculateGridNavigation(key, currentIndex, elements, container) {
    const containerRect = container.getBoundingClientRect()
    const currentElement = elements[currentIndex]
    const currentRect = currentElement.getBoundingClientRect()

    let bestMatch = currentIndex
    let bestDistance = Infinity

    Array.from(elements).forEach((element, index) => {
      if (index === currentIndex) return

      const rect = element.getBoundingClientRect()
      let isValidDirection = false
      let distance = 0

      switch (key) {
        case 'ArrowUp':
          isValidDirection = rect.bottom <= currentRect.top
          distance = currentRect.top - rect.bottom + Math.abs(rect.left - currentRect.left)
          break
        case 'ArrowDown':
          isValidDirection = rect.top >= currentRect.bottom
          distance = rect.top - currentRect.bottom + Math.abs(rect.left - currentRect.left)
          break
        case 'ArrowLeft':
          isValidDirection = rect.right <= currentRect.left
          distance = currentRect.left - rect.right + Math.abs(rect.top - currentRect.top)
          break
        case 'ArrowRight':
          isValidDirection = rect.left >= currentRect.right
          distance = rect.left - currentRect.right + Math.abs(rect.top - currentRect.top)
          break
      }

      if (isValidDirection && distance < bestDistance) {
        bestDistance = distance
        bestMatch = index
      }
    })

    return bestMatch
  }

  /**
   * Make element accessible
   */
  makeAccessible(element, options = {}) {
    const {
      role,
      label,
      description,
      expanded,
      selected,
      disabled,
      required,
      invalid,
      live,
      atomic
    } = options

    // Set role
    if (role) {
      element.setAttribute('role', role)
    }

    // Set accessible name
    if (label) {
      element.setAttribute('aria-label', label)
    }

    // Set description
    if (description) {
      const descId = `desc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const descElement = document.createElement('div')
      descElement.id = descId
      descElement.className = 'sr-only'
      descElement.textContent = description
      element.parentNode.insertBefore(descElement, element.nextSibling)
      element.setAttribute('aria-describedby', descId)
    }

    // Set states
    if (expanded !== undefined) {
      element.setAttribute('aria-expanded', expanded.toString())
    }

    if (selected !== undefined) {
      element.setAttribute('aria-selected', selected.toString())
    }

    if (disabled !== undefined) {
      element.setAttribute('aria-disabled', disabled.toString())
      if (disabled) {
        element.setAttribute('tabindex', '-1')
      }
    }

    if (required !== undefined) {
      element.setAttribute('aria-required', required.toString())
    }

    if (invalid !== undefined) {
      element.setAttribute('aria-invalid', invalid.toString())
    }

    // Set live regions
    if (live) {
      element.setAttribute('aria-live', live)
    }

    if (atomic !== undefined) {
      element.setAttribute('aria-atomic', atomic.toString())
    }

    return element
  }

  /**
   * Create skip link
   */
  createSkipLink(targetSelector, text = 'Saltar al contenido principal') {
    const skipLink = document.createElement('a')
    skipLink.href = targetSelector
    skipLink.className = 'skip-link'
    skipLink.textContent = text
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 10000;
      border-radius: 4px;
    `

    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px'
    })

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px'
    })

    skipLink.addEventListener('click', (e) => {
      e.preventDefault()
      const target = document.querySelector(targetSelector)
      if (target) {
        target.focus()
        target.scrollIntoView()
      }
    })

    return skipLink
  }

  /**
   * Ensure color contrast compliance
   */
  checkColorContrast(foreground, background) {
    // Convert colors to RGB
    const fgRgb = this.hexToRgb(foreground)
    const bgRgb = this.hexToRgb(background)

    if (!fgRgb || !bgRgb) return false

    // Calculate relative luminance
    const fgLuminance = this.getRelativeLuminance(fgRgb)
    const bgLuminance = this.getRelativeLuminance(bgRgb)

    // Calculate contrast ratio
    const contrastRatio = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                         (Math.min(fgLuminance, bgLuminance) + 0.05)

    // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
    return {
      ratio: contrastRatio,
      passAA: contrastRatio >= 4.5,
      passAAA: contrastRatio >= 7,
      passLarge: contrastRatio >= 3
    }
  }

  /**
   * Convert hex color to RGB
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  /**
   * Calculate relative luminance
   */
  getRelativeLuminance(rgb) {
    const { r, g, b } = rgb
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  /**
   * Create accessible modal
   */
  createAccessibleModal(content, options = {}) {
    const {
      title = 'Modal',
      closeLabel = 'Cerrar',
      trapFocus = true,
      closeOnEscape = true,
      closeOnOverlay = true,
      describedBy = null
    } = options

    const modal = document.createElement('div')
    modal.className = 'modal'
    modal.setAttribute('role', 'dialog')
    modal.setAttribute('aria-modal', 'true')
    modal.setAttribute('aria-labelledby', 'modal-title')
    
    if (describedBy) {
      modal.setAttribute('aria-describedby', describedBy)
    }

    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'
    overlay.setAttribute('aria-hidden', 'true')

    const modalContent = document.createElement('div')
    modalContent.className = 'modal-content'

    const header = document.createElement('div')
    header.className = 'modal-header'

    const titleElement = document.createElement('h2')
    titleElement.id = 'modal-title'
    titleElement.textContent = title

    const closeButton = document.createElement('button')
    closeButton.className = 'close-button'
    closeButton.setAttribute('aria-label', closeLabel)
    closeButton.setAttribute('type', 'button')
    closeButton.innerHTML = '<span aria-hidden="true">&times;</span>'

    const body = document.createElement('div')
    body.className = 'modal-body'
    body.appendChild(content)

    header.appendChild(titleElement)
    header.appendChild(closeButton)
    modalContent.appendChild(header)
    modalContent.appendChild(body)
    modal.appendChild(overlay)
    modal.appendChild(modalContent)

    // Event listeners
    const closeModal = () => {
      // Announce modal closing
      this.announce('Modal cerrado')
      modal.classList.add('closing')
      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal)
        }
      }, 300)
    }

    closeButton.addEventListener('click', closeModal)

    if (closeOnOverlay) {
      overlay.addEventListener('click', closeModal)
    }

    if (closeOnEscape) {
      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeModal()
        }
      })
    }

    if (trapFocus) {
      this.trapFocusInModal(modal)
    }

    return modal
  }

  /**
   * Trap focus within modal
   */
  trapFocusInModal(modal) {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    })

    // Focus first element when modal opens
    setTimeout(() => {
      firstElement.focus()
    }, 100)
  }

  /**
   * Create accessible button with proper ARIA attributes
   */
  createAccessibleButton(text, options = {}) {
    const {
      ariaLabel,
      ariaDescribedBy,
      ariaExpanded,
      ariaPressed,
      disabled = false,
      className = '',
      onClick
    } = options

    const button = document.createElement('button')
    button.type = 'button'
    button.className = className
    button.textContent = text

    if (ariaLabel) {
      button.setAttribute('aria-label', ariaLabel)
    }

    if (ariaDescribedBy) {
      button.setAttribute('aria-describedby', ariaDescribedBy)
    }

    if (ariaExpanded !== undefined) {
      button.setAttribute('aria-expanded', ariaExpanded.toString())
    }

    if (ariaPressed !== undefined) {
      button.setAttribute('aria-pressed', ariaPressed.toString())
    }

    if (disabled) {
      button.disabled = true
      button.setAttribute('aria-disabled', 'true')
    }

    if (onClick) {
      button.addEventListener('click', onClick)
    }

    return button
  }

  /**
   * Create accessible list with proper ARIA attributes
   */
  createAccessibleList(items, options = {}) {
    const {
      role = 'list',
      ariaLabel,
      className = '',
      itemRole = 'listitem',
      keyboardNavigation = true
    } = options

    const list = document.createElement('ul')
    list.setAttribute('role', role)
    list.className = className

    if (ariaLabel) {
      list.setAttribute('aria-label', ariaLabel)
    }

    if (keyboardNavigation) {
      list.setAttribute('data-keyboard-navigation', 'list')
    }

    items.forEach((item, index) => {
      const listItem = document.createElement('li')
      listItem.setAttribute('role', itemRole)
      listItem.tabIndex = index === 0 ? 0 : -1

      if (typeof item === 'string') {
        listItem.textContent = item
      } else if (item.content) {
        listItem.innerHTML = item.content
      }

      if (item.ariaLabel) {
        listItem.setAttribute('aria-label', item.ariaLabel)
      }

      list.appendChild(listItem)
    })

    return list
  }

  /**
   * Create accessible grid with proper ARIA attributes
   */
  createAccessibleGrid(items, options = {}) {
    const {
      columns = 3,
      ariaLabel,
      className = '',
      keyboardNavigation = true
    } = options

    const grid = document.createElement('div')
    grid.setAttribute('role', 'grid')
    grid.className = className

    if (ariaLabel) {
      grid.setAttribute('aria-label', ariaLabel)
    }

    if (keyboardNavigation) {
      grid.setAttribute('data-keyboard-navigation', 'grid')
    }

    // Calculate rows
    const rows = Math.ceil(items.length / columns)

    for (let row = 0; row < rows; row++) {
      const rowElement = document.createElement('div')
      rowElement.setAttribute('role', 'row')
      rowElement.className = 'grid-row'

      for (let col = 0; col < columns; col++) {
        const itemIndex = row * columns + col
        if (itemIndex >= items.length) break

        const item = items[itemIndex]
        const cell = document.createElement('div')
        cell.setAttribute('role', 'gridcell')
        cell.className = 'grid-cell'
        cell.tabIndex = itemIndex === 0 ? 0 : -1

        if (typeof item === 'string') {
          cell.textContent = item
        } else if (item.content) {
          cell.innerHTML = item.content
        }

        if (item.ariaLabel) {
          cell.setAttribute('aria-label', item.ariaLabel)
        }

        rowElement.appendChild(cell)
      }

      grid.appendChild(rowElement)
    }

    return grid
  }

  /**
   * Create accessible progress bar
   */
  createAccessibleProgressBar(options = {}) {
    const {
      min = 0,
      max = 100,
      value = 0,
      label = 'Progreso',
      className = ''
    } = options

    const progressContainer = document.createElement('div')
    progressContainer.className = `progress-container ${className}`

    const progressBar = document.createElement('div')
    progressBar.setAttribute('role', 'progressbar')
    progressBar.setAttribute('aria-valuemin', min.toString())
    progressBar.setAttribute('aria-valuemax', max.toString())
    progressBar.setAttribute('aria-valuenow', value.toString())
    progressBar.setAttribute('aria-label', label)
    progressBar.className = 'progress-bar'

    const progressFill = document.createElement('div')
    progressFill.className = 'progress-fill'
    progressFill.style.width = `${(value / max) * 100}%`

    progressBar.appendChild(progressFill)
    progressContainer.appendChild(progressBar)

    // Method to update progress
    progressContainer.updateProgress = (newValue) => {
      progressBar.setAttribute('aria-valuenow', newValue.toString())
      progressFill.style.width = `${(newValue / max) * 100}%`
    }

    return progressContainer
  }

  /**
   * Create accessible tab panel system
   */
  createAccessibleTabs(tabs, options = {}) {
    const {
      className = '',
      defaultTab = 0
    } = options

    const tabContainer = document.createElement('div')
    tabContainer.className = `tab-container ${className}`

    const tabList = document.createElement('div')
    tabList.setAttribute('role', 'tablist')
    tabList.className = 'tab-list'

    const tabPanels = document.createElement('div')
    tabPanels.className = 'tab-panels'

    tabs.forEach((tab, index) => {
      // Create tab button
      const tabButton = document.createElement('button')
      tabButton.setAttribute('role', 'tab')
      tabButton.setAttribute('aria-selected', (index === defaultTab).toString())
      tabButton.setAttribute('aria-controls', `panel-${index}`)
      tabButton.id = `tab-${index}`
      tabButton.className = `tab-button ${index === defaultTab ? 'active' : ''}`
      tabButton.textContent = tab.label
      tabButton.tabIndex = index === defaultTab ? 0 : -1

      // Create tab panel
      const tabPanel = document.createElement('div')
      tabPanel.setAttribute('role', 'tabpanel')
      tabPanel.setAttribute('aria-labelledby', `tab-${index}`)
      tabPanel.id = `panel-${index}`
      tabPanel.className = `tab-panel ${index === defaultTab ? 'active' : ''}`
      tabPanel.tabIndex = 0

      if (typeof tab.content === 'string') {
        tabPanel.innerHTML = tab.content
      } else {
        tabPanel.appendChild(tab.content)
      }

      if (index !== defaultTab) {
        tabPanel.hidden = true
      }

      tabList.appendChild(tabButton)
      tabPanels.appendChild(tabPanel)
    })

    tabContainer.appendChild(tabList)
    tabContainer.appendChild(tabPanels)

    // Add tab switching functionality
    tabList.addEventListener('click', (e) => {
      if (e.target.getAttribute('role') === 'tab') {
        this.switchTab(tabList, tabPanels, e.target)
      }
    })

    tabList.addEventListener('keydown', (e) => {
      if (e.target.getAttribute('role') === 'tab') {
        this.handleTabKeydown(e, tabList, tabPanels)
      }
    })

    return tabContainer
  }

  /**
   * Switch active tab
   */
  switchTab(tabList, tabPanels, activeTab) {
    const allTabs = tabList.querySelectorAll('[role="tab"]')
    const allPanels = tabPanels.querySelectorAll('[role="tabpanel"]')
    const activeIndex = Array.from(allTabs).indexOf(activeTab)

    // Update tabs
    allTabs.forEach((tab, index) => {
      const isActive = index === activeIndex
      tab.setAttribute('aria-selected', isActive.toString())
      tab.tabIndex = isActive ? 0 : -1
      tab.classList.toggle('active', isActive)
    })

    // Update panels
    allPanels.forEach((panel, index) => {
      const isActive = index === activeIndex
      panel.hidden = !isActive
      panel.classList.toggle('active', isActive)
    })

    // Announce tab change
    this.announce(`Pestaña cambiada a: ${activeTab.textContent}`)
  }

  /**
   * Handle tab keyboard navigation
   */
  handleTabKeydown(e, tabList, tabPanels) {
    const allTabs = tabList.querySelectorAll('[role="tab"]')
    const currentIndex = Array.from(allTabs).indexOf(e.target)
    let nextIndex = currentIndex

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        nextIndex = (currentIndex + 1) % allTabs.length
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        nextIndex = currentIndex === 0 ? allTabs.length - 1 : currentIndex - 1
        break
      case 'Home':
        e.preventDefault()
        nextIndex = 0
        break
      case 'End':
        e.preventDefault()
        nextIndex = allTabs.length - 1
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        this.switchTab(tabList, tabPanels, e.target)
        return
    }

    if (nextIndex !== currentIndex) {
      allTabs[nextIndex].focus()
      this.switchTab(tabList, tabPanels, allTabs[nextIndex])
    }
  }

  /**
   * Validate color contrast for educational content
   */
  validateEducationalContentContrast() {
    const contrastChecks = [
      { selector: '.educational-modal', fg: '#ffffff', bg: '#000000' },
      { selector: '.modal-content', fg: '#333333', bg: '#ffffff' },
      { selector: '.modal-header h2', fg: '#1a1a1a', bg: '#ffffff' },
      { selector: '.content-section h3', fg: '#2c2c2c', bg: '#ffffff' },
      { selector: '.coco-quote', fg: '#212529', bg: '#f8f9fa' },
      { selector: '.offering-item', fg: '#212529', bg: '#f8f9fa' },
      { selector: '.play-audio-btn', fg: '#ffffff', bg: '#007bff' }
    ]

    const results = contrastChecks.map(check => {
      const result = this.checkColorContrast(check.fg, check.bg)
      return {
        selector: check.selector,
        ...result,
        compliant: result.passAA
      }
    })

    console.log('🎨 Color contrast validation results:', results)
    return results
  }

  /**
   * Dispose accessibility manager
   */
  dispose() {
    if (this.announcer && this.announcer.parentNode) {
      this.announcer.parentNode.removeChild(this.announcer)
    }
    console.log('🧹 Accessibility Manager disposed')
  }
}

// Create global instance
export const accessibilityManager = new AccessibilityManager()
/**
 * Accessibility Manager Tests
 * Tests for accessibility features and WCAG compliance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AccessibilityManager } from '../../src/utils/accessibility.js'

describe('AccessibilityManager', () => {
  let accessibilityManager
  let mockDocument

  beforeEach(() => {
    // Mock DOM environment
    global.document = {
      createElement: vi.fn(() => ({
        id: '',
        className: '',
        style: { cssText: '' },
        setAttribute: vi.fn(),
        appendChild: vi.fn(),
        textContent: ''
      })),
      body: {
        appendChild: vi.fn(),
        classList: {
          add: vi.fn(),
          remove: vi.fn()
        }
      },
      documentElement: {
        classList: {
          add: vi.fn(),
          remove: vi.fn()
        }
      },
      addEventListener: vi.fn(),
      querySelector: vi.fn(),
      querySelectorAll: vi.fn(() => [])
    }

    global.window = {
      matchMedia: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn()
      })),
      speechSynthesis: {
        getVoices: vi.fn(() => [])
      },
      navigator: {
        userAgent: 'test-browser'
      }
    }

    accessibilityManager = new AccessibilityManager()
  })

  afterEach(() => {
    if (accessibilityManager) {
      accessibilityManager.dispose()
    }
  })

  describe('initialization', () => {
    it('should initialize accessibility manager', () => {
      accessibilityManager.init()
      
      expect(document.createElement).toHaveBeenCalledWith('div')
      expect(document.body.appendChild).toHaveBeenCalled()
    })

    it('should detect user preferences', () => {
      accessibilityManager.detectUserPreferences()
      
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-contrast: high)')
      expect(window.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
    })
  })

  describe('screen reader announcements', () => {
    beforeEach(() => {
      accessibilityManager.init()
    })

    it('should announce messages to screen readers', () => {
      const message = 'Test announcement'
      accessibilityManager.announce(message)
      
      expect(accessibilityManager.announcer.textContent).toBe(message)
    })

    it('should clear announcements after timeout', (done) => {
      const message = 'Test announcement'
      accessibilityManager.announce(message)
      
      setTimeout(() => {
        expect(accessibilityManager.announcer.textContent).toBe('')
        done()
      }, 1100)
    })
  })

  describe('color contrast validation', () => {
    it('should validate color contrast ratios', () => {
      const result = accessibilityManager.checkColorContrast('#000000', '#ffffff')
      
      expect(result.ratio).toBeGreaterThan(4.5)
      expect(result.passAA).toBe(true)
      expect(result.passAAA).toBe(true)
    })

    it('should fail low contrast combinations', () => {
      const result = accessibilityManager.checkColorContrast('#cccccc', '#ffffff')
      
      expect(result.ratio).toBeLessThan(4.5)
      expect(result.passAA).toBe(false)
    })

    it('should validate educational content contrast', () => {
      const results = accessibilityManager.validateEducationalContentContrast()
      
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBeGreaterThan(0)
      
      // Check that most elements pass AA compliance
      const compliantElements = results.filter(r => r.compliant)
      expect(compliantElements.length).toBeGreaterThan(results.length * 0.8)
    })
  })

  describe('accessible component creation', () => {
    it('should create accessible buttons', () => {
      const button = accessibilityManager.createAccessibleButton('Test Button', {
        ariaLabel: 'Test button for accessibility',
        onClick: vi.fn()
      })
      
      expect(button.tagName).toBe('BUTTON')
      expect(button.textContent).toBe('Test Button')
      expect(button.getAttribute('aria-label')).toBe('Test button for accessibility')
    })

    it('should create accessible lists', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      const list = accessibilityManager.createAccessibleList(items, {
        ariaLabel: 'Test list',
        keyboardNavigation: true
      })
      
      expect(list.getAttribute('role')).toBe('list')
      expect(list.getAttribute('aria-label')).toBe('Test list')
      expect(list.getAttribute('data-keyboard-navigation')).toBe('list')
    })

    it('should create accessible grids', () => {
      const items = ['Cell 1', 'Cell 2', 'Cell 3', 'Cell 4']
      const grid = accessibilityManager.createAccessibleGrid(items, {
        columns: 2,
        ariaLabel: 'Test grid'
      })
      
      expect(grid.getAttribute('role')).toBe('grid')
      expect(grid.getAttribute('aria-label')).toBe('Test grid')
    })

    it('should create accessible progress bars', () => {
      const progressBar = accessibilityManager.createAccessibleProgressBar({
        min: 0,
        max: 100,
        value: 50,
        label: 'Test progress'
      })
      
      const progressElement = progressBar.querySelector('[role="progressbar"]')
      expect(progressElement.getAttribute('aria-valuemin')).toBe('0')
      expect(progressElement.getAttribute('aria-valuemax')).toBe('100')
      expect(progressElement.getAttribute('aria-valuenow')).toBe('50')
      expect(progressElement.getAttribute('aria-label')).toBe('Test progress')
    })
  })

  describe('keyboard navigation', () => {
    it('should handle arrow key navigation', () => {
      const mockEvent = {
        key: 'ArrowDown',
        target: { closest: vi.fn(() => null) },
        preventDefault: vi.fn()
      }
      
      accessibilityManager.handleArrowKeyNavigation(mockEvent)
      
      // Should not throw errors when no navigation parent is found
      expect(mockEvent.target.closest).toHaveBeenCalledWith('[data-keyboard-navigation]')
    })

    it('should calculate grid navigation correctly', () => {
      const mockElements = [
        { getBoundingClientRect: () => ({ top: 0, bottom: 50, left: 0, right: 50 }) },
        { getBoundingClientRect: () => ({ top: 0, bottom: 50, left: 60, right: 110 }) },
        { getBoundingClientRect: () => ({ top: 60, bottom: 110, left: 0, right: 50 }) }
      ]
      
      const result = accessibilityManager.calculateGridNavigation('ArrowDown', 0, mockElements, {})
      
      expect(typeof result).toBe('number')
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThan(mockElements.length)
    })
  })

  describe('modal accessibility', () => {
    it('should create accessible modals', () => {
      const content = document.createElement('div')
      content.textContent = 'Modal content'
      
      const modal = accessibilityManager.createAccessibleModal(content, {
        title: 'Test Modal',
        closeLabel: 'Close modal'
      })
      
      expect(modal.getAttribute('role')).toBe('dialog')
      expect(modal.getAttribute('aria-modal')).toBe('true')
      expect(modal.getAttribute('aria-labelledby')).toBe('modal-title')
    })

    it('should trap focus in modals', () => {
      const content = document.createElement('div')
      const modal = accessibilityManager.createAccessibleModal(content)
      
      // Mock focusable elements
      const mockButton1 = { focus: vi.fn() }
      const mockButton2 = { focus: vi.fn() }
      
      modal.querySelectorAll = vi.fn(() => [mockButton1, mockButton2])
      
      accessibilityManager.trapFocusInModal(modal)
      
      // Should set up focus trapping
      expect(modal.querySelectorAll).toHaveBeenCalledWith(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    })
  })

  describe('accessibility settings', () => {
    it('should apply high contrast mode', () => {
      accessibilityManager.highContrastMode = true
      accessibilityManager.applyAccessibilitySettings()
      
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('high-contrast')
    })

    it('should apply reduced motion mode', () => {
      accessibilityManager.reducedMotion = true
      accessibilityManager.applyAccessibilitySettings()
      
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('reduced-motion')
    })

    it('should apply screen reader mode', () => {
      accessibilityManager.screenReaderMode = true
      accessibilityManager.applyAccessibilitySettings()
      
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('screen-reader')
    })
  })
})
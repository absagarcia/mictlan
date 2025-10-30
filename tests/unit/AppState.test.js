/**
 * AppState Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AppState } from '../../src/state/AppState.js'
import { cleanup } from '../setup.js'

describe('AppState', () => {
  let appState

  beforeEach(() => {
    cleanup()
    appState = new AppState()
  })

  describe('initialization', () => {
    it('should initialize with default state', () => {
      expect(appState.get('user.language')).toBe('es')
      expect(appState.get('memorials')).toEqual([])
      expect(appState.get('ui.currentView')).toBe('home')
      expect(appState.get('arSession.isActive')).toBe(false)
    })

    it('should generate unique user ID', () => {
      const userId = appState.get('user.userId')
      expect(userId).toMatch(/^user_[a-z0-9]+_\d+$/)
    })

    it('should detect language from navigator', () => {
      // Mock navigator.language
      Object.defineProperty(navigator, 'language', {
        value: 'en-US',
        configurable: true
      })
      
      const newAppState = new AppState()
      expect(newAppState.get('user.language')).toBe('en')
    })
  })

  describe('reactive state management', () => {
    it('should subscribe to state changes', () => {
      const callback = vi.fn()
      const unsubscribe = appState.subscribe('user.language', callback)
      
      // Get the current language first
      const currentLang = appState.get('user.language')
      appState.set('user.language', 'en')
      
      expect(callback).toHaveBeenCalledWith('en', currentLang, 'user.language')
      
      unsubscribe()
      appState.set('user.language', 'es')
      
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should notify parent path observers', () => {
      const userCallback = vi.fn()
      const languageCallback = vi.fn()
      
      appState.subscribe('user', userCallback)
      appState.subscribe('user.language', languageCallback)
      
      // Get the current language first
      const currentLang = appState.get('user.language')
      appState.set('user.language', 'en')
      
      expect(languageCallback).toHaveBeenCalledWith('en', currentLang, 'user.language')
      expect(userCallback).toHaveBeenCalled()
    })

    it('should handle nested path updates', () => {
      appState.set('user.syncSettings.autoSync', false)
      expect(appState.get('user.syncSettings.autoSync')).toBe(false)
    })
  })

  describe('array operations', () => {
    it('should add items to arrays', () => {
      const memorial = { id: 'test', name: 'Test Memorial' }
      appState.push('memorials', memorial)
      
      expect(appState.get('memorials')).toContain(memorial)
    })

    it('should remove items from arrays', () => {
      const memorial1 = { id: 'test1', name: 'Memorial 1' }
      const memorial2 = { id: 'test2', name: 'Memorial 2' }
      
      appState.set('memorials', [memorial1, memorial2])
      appState.remove('memorials', item => item.id === 'test1')
      
      expect(appState.get('memorials')).toEqual([memorial2])
    })
  })

  describe('actions', () => {
    it('should set language and update document', () => {
      appState.actions.setLanguage('en')
      
      expect(appState.get('user.language')).toBe('en')
      expect(document.documentElement.lang).toBe('en')
    })

    it('should toggle theme', () => {
      appState.set('ui.theme', 'light')
      appState.actions.toggleTheme()
      
      expect(appState.get('ui.theme')).toBe('dark')
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    })

    it('should add memorial with generated ID', () => {
      const memorial = appState.actions.addMemorial({
        name: 'Test Memorial',
        relationship: 'padre'
      })
      
      expect(memorial.id).toMatch(/^memorial_\d+$/)
      expect(memorial.name).toBe('Test Memorial')
      expect(memorial.syncStatus).toBe('local')
      expect(appState.get('memorials')).toContain(memorial)
    })

    it('should update memorial and mark as pending sync', () => {
      const memorial = appState.actions.addMemorial({
        name: 'Original Name'
      })
      
      const updated = appState.actions.updateMemorial(memorial.id, {
        name: 'Updated Name'
      })
      
      expect(updated.name).toBe('Updated Name')
      expect(updated.syncStatus).toBe('pending')
    })

    it('should show and auto-remove notifications', async () => {
      vi.useFakeTimers()
      
      appState.actions.showNotification({
        type: 'info',
        message: 'Test notification'
      })
      
      const notifications = appState.get('ui.notifications')
      expect(notifications).toHaveLength(1)
      expect(notifications[0].message).toBe('Test notification')
      
      // Wait for auto-removal (mocked setTimeout)
      vi.advanceTimersByTime(5000)
      
      expect(appState.get('ui.notifications')).toHaveLength(0)
      
      vi.useRealTimers()
    })
  })

  describe('storage integration', () => {
    it('should save state to localStorage', () => {
      appState.set('user.language', 'en')
      
      // Trigger save
      appState.saveToStorage()
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'mictla-app-state',
        expect.stringContaining('"language":"en"')
      )
    })

    it('should load state from localStorage', () => {
      const mockState = {
        user: { language: 'en' },
        memorials: [{ id: 'test', name: 'Test' }]
      }
      
      localStorage.getItem.mockReturnValue(JSON.stringify(mockState))
      
      const newAppState = new AppState()
      
      expect(newAppState.get('user.language')).toBe('en')
      expect(newAppState.get('memorials')).toEqual([{ id: 'test', name: 'Test' }])
    })
  })

  describe('AR session management', () => {
    it('should start AR session', () => {
      appState.actions.startARSession()
      
      expect(appState.get('arSession.isActive')).toBe(true)
    })

    it('should end AR session and cleanup', () => {
      appState.set('arSession.isActive', true)
      appState.set('arSession.camera', {})
      
      appState.actions.endARSession()
      
      expect(appState.get('arSession.isActive')).toBe(false)
      expect(appState.get('arSession.camera')).toBeNull()
    })
  })
})
/**
 * Router Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Router } from '../../src/router/Router.js'
import { cleanup } from '../setup.js'

// Mock history API
const mockHistory = {
  pushState: vi.fn(),
  replaceState: vi.fn(),
  back: vi.fn(),
  forward: vi.fn()
}

Object.defineProperty(window, 'history', {
  value: mockHistory,
  writable: true
})

describe('Router', () => {
  let router
  let container

  beforeEach(() => {
    cleanup()
    router = new Router()
    container = document.createElement('div')
    document.body.appendChild(container)
    
    // Reset URL
    Object.defineProperty(window, 'location', {
      value: { pathname: '/', search: '' },
      writable: true
    })
  })

  describe('route registration', () => {
    it('should register routes', () => {
      const handler = vi.fn()
      router.route('/', handler)
      
      expect(router.routes.has('/')).toBe(true)
    })

    it('should convert path patterns to regex', () => {
      const pattern = router.pathToRegex('/user/:id')
      expect(pattern.test('/user/123')).toBe(true)
      expect(pattern.test('/user/abc')).toBe(true)
      expect(pattern.test('/user/')).toBe(false)
    })

    it('should extract parameter keys', () => {
      const keys = router.extractKeys('/user/:id/post/:postId')
      expect(keys).toEqual(['id', 'postId'])
    })
  })

  describe('route matching', () => {
    beforeEach(() => {
      router.route('/', vi.fn())
      router.route('/altar', vi.fn())
      router.route('/memories/:id', vi.fn())
    })

    it('should match exact routes', () => {
      const match = router.findMatchingRoute('/')
      expect(match).toBeTruthy()
      expect(match.route.path).toBe('/')
    })

    it('should match parameterized routes', () => {
      const match = router.findMatchingRoute('/memories/123')
      expect(match).toBeTruthy()
      expect(match.route.path).toBe('/memories/:id')
      expect(match.params.id).toBe('123')
    })

    it('should parse query parameters', () => {
      const match = router.findMatchingRoute('/altar?level=2&lang=es')
      expect(match.query.level).toBe('2')
      expect(match.query.lang).toBe('es')
    })

    it('should return null for unmatched routes', () => {
      const match = router.findMatchingRoute('/nonexistent')
      expect(match).toBeNull()
    })
  })

  describe('navigation', () => {
    it('should navigate to routes', () => {
      const handler = vi.fn()
      router.route('/test', handler)
      router.init(container)
      
      router.navigate('/test')
      
      expect(mockHistory.pushState).toHaveBeenCalledWith({}, '', '/test')
    })

    it('should replace history entry when specified', () => {
      const handler = vi.fn()
      router.route('/test', handler)
      router.init(container)
      
      router.navigate('/test', {}, true)
      
      expect(mockHistory.replaceState).toHaveBeenCalledWith({}, '', '/test')
    })

    it('should call route handlers with correct context', async () => {
      const handler = vi.fn()
      router.route('/test/:id', handler)
      router.init(container)
      
      await router.handleRoute('/test/123?foo=bar')
      
      expect(handler).toHaveBeenCalledWith({
        path: '/test/123?foo=bar',
        params: { id: '123' },
        query: { foo: 'bar' },
        state: {},
        container
      })
    })
  })

  describe('link handling', () => {
    it('should handle internal link clicks', () => {
      const handler = vi.fn()
      router.route('/test', handler)
      router.init(container)
      
      const link = document.createElement('a')
      link.href = '/test'
      document.body.appendChild(link)
      
      const event = new MouseEvent('click', { bubbles: true })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      
      link.dispatchEvent(event)
      
      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(mockHistory.pushState).toHaveBeenCalledWith({}, '', '/test')
    })

    it('should ignore external links', () => {
      const link = document.createElement('a')
      link.href = 'https://external.com'
      document.body.appendChild(link)
      
      const event = new MouseEvent('click', { bubbles: true })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      
      link.dispatchEvent(event)
      
      expect(preventDefaultSpy).not.toHaveBeenCalled()
    })

    it('should ignore clicks with modifier keys', () => {
      const link = document.createElement('a')
      link.href = '/test'
      document.body.appendChild(link)
      
      const event = new MouseEvent('click', { 
        bubbles: true, 
        ctrlKey: true 
      })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      
      link.dispatchEvent(event)
      
      expect(preventDefaultSpy).not.toHaveBeenCalled()
    })
  })

  describe('URL generation', () => {
    it('should generate URLs with parameters', () => {
      const url = router.url('/user/:id/post/:postId', 
        { id: '123', postId: '456' },
        { tab: 'comments' }
      )
      
      expect(url).toBe('/user/123/post/456?tab=comments')
    })

    it('should encode URL parameters', () => {
      const url = router.url('/search/:query', 
        { query: 'hello world' }
      )
      
      expect(url).toBe('/search/hello%20world')
    })
  })

  describe('route state', () => {
    it('should track current route', async () => {
      const handler = vi.fn()
      router.route('/test', handler)
      router.init(container)
      
      await router.handleRoute('/test')
      
      const currentRoute = router.getCurrentRoute()
      expect(currentRoute.path).toBe('/test')
      expect(currentRoute.route.path).toBe('/test')
    })

    it('should check if route is active', async () => {
      const handler = vi.fn()
      router.route('/altar', handler)
      router.init(container)
      
      await router.handleRoute('/altar')
      
      expect(router.isActive('/altar')).toBe(true)
      expect(router.isActive('/memories')).toBe(false)
    })

    it('should handle root route active check', async () => {
      const handler = vi.fn()
      router.route('/', handler)
      router.init(container)
      
      await router.handleRoute('/')
      
      expect(router.isActive('/')).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should handle route handler errors', async () => {
      const errorHandler = vi.fn().mockRejectedValue(new Error('Test error'))
      router.route('/error', errorHandler)
      router.init(container)
      
      await router.handleRoute('/error')
      
      // Should not throw, should handle gracefully
      expect(errorHandler).toHaveBeenCalled()
    })

    it('should handle 404 routes', async () => {
      router.init(container)
      
      await router.handleRoute('/nonexistent')
      
      // Should redirect to home or 404 page
      expect(mockHistory.replaceState).toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('should remove event listeners on destroy', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      const documentRemoveSpy = vi.spyOn(document, 'removeEventListener')
      
      router.destroy()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('popstate', router.handlePopState)
      expect(documentRemoveSpy).toHaveBeenCalledWith('click', router.handleLinkClick)
    })
  })
})
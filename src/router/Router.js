/**
 * Mictla Router
 * Simple SPA router with deep linking support
 */

import { appState } from '../state/AppState.js'

class Router {
  constructor() {
    this.routes = new Map()
    this.currentRoute = null
    this.container = null
    
    // Bind methods
    this.handlePopState = this.handlePopState.bind(this)
    this.handleLinkClick = this.handleLinkClick.bind(this)
    
    // Setup event listeners
    this.setupEventListeners()
  }

  /**
   * Initialize router with container element
   * @param {HTMLElement} container - Container element for route content
   */
  init(container) {
    this.container = container
    
    // Handle initial route
    this.handleRoute(window.location.pathname)
    
    return this
  }

  /**
   * Register a route
   * @param {string} path - Route path (supports :param syntax)
   * @param {Function} handler - Route handler function
   * @param {Object} options - Route options
   */
  route(path, handler, options = {}) {
    const routeConfig = {
      path,
      handler,
      pattern: this.pathToRegex(path),
      keys: this.extractKeys(path),
      ...options
    }
    
    this.routes.set(path, routeConfig)
    return this
  }

  /**
   * Navigate to a route
   * @param {string} path - Path to navigate to
   * @param {Object} state - State object to pass
   * @param {boolean} replace - Whether to replace current history entry
   */
  navigate(path, state = {}, replace = false) {
    if (replace) {
      window.history.replaceState(state, '', path)
    } else {
      window.history.pushState(state, '', path)
    }
    
    this.handleRoute(path, state)
  }

  /**
   * Go back in history
   */
  back() {
    window.history.back()
  }

  /**
   * Go forward in history
   */
  forward() {
    window.history.forward()
  }

  /**
   * Handle route change
   * @param {string} path - Current path
   * @param {Object} state - History state
   */
  async handleRoute(path, state = {}) {
    // Find matching route
    const matchedRoute = this.findMatchingRoute(path)
    
    if (!matchedRoute) {
      console.warn(`No route found for path: ${path}`)
      this.handleNotFound(path)
      return
    }

    const { route, params, query } = matchedRoute
    
    // Update app state
    const viewName = this.pathToViewName(path)
    appState.set('ui.currentView', viewName)
    
    try {
      // Show loading state
      appState.set('ui.loading', true)
      
      // Execute route handler
      await route.handler({
        path,
        params,
        query,
        state,
        container: this.container
      })
      
      // Update current route
      this.currentRoute = {
        path,
        route,
        params,
        query,
        state
      }
      
    } catch (error) {
      console.error('Route handler error:', error)
      this.handleError(error, path)
    } finally {
      appState.set('ui.loading', false)
    }
  }

  /**
   * Find matching route for path
   * @param {string} path - Path to match
   * @returns {Object|null} Matched route info
   */
  findMatchingRoute(path) {
    const [pathname, search] = path.split('?')
    const query = this.parseQuery(search)
    
    for (const [routePath, route] of this.routes) {
      const match = pathname.match(route.pattern)
      if (match) {
        const params = {}
        route.keys.forEach((key, index) => {
          params[key] = match[index + 1]
        })
        
        return { route, params, query }
      }
    }
    
    return null
  }

  /**
   * Convert path pattern to regex
   * @param {string} path - Path pattern
   * @returns {RegExp} Regex pattern
   */
  pathToRegex(path) {
    const pattern = path
      .replace(/\//g, '\\/')
      .replace(/:([^\/]+)/g, '([^\/]+)')
    
    return new RegExp(`^${pattern}$`)
  }

  /**
   * Extract parameter keys from path
   * @param {string} path - Path pattern
   * @returns {Array} Parameter keys
   */
  extractKeys(path) {
    const keys = []
    const matches = path.matchAll(/:([^\/]+)/g)
    
    for (const match of matches) {
      keys.push(match[1])
    }
    
    return keys
  }

  /**
   * Parse query string
   * @param {string} search - Query string
   * @returns {Object} Query parameters
   */
  parseQuery(search = '') {
    const query = {}
    const params = new URLSearchParams(search)
    
    for (const [key, value] of params) {
      query[key] = value
    }
    
    return query
  }

  /**
   * Convert path to view name
   * @param {string} path - Current path
   * @returns {string} View name
   */
  pathToViewName(path) {
    const pathname = path.split('?')[0]
    if (pathname === '/') return 'home'
    return pathname.slice(1).split('/')[0]
  }

  /**
   * Handle 404 not found
   * @param {string} path - Requested path
   */
  handleNotFound(path) {
    console.log(`404: ${path}`)
    
    // Try to redirect to home or show 404 page
    if (this.routes.has('/404')) {
      this.navigate('/404', { originalPath: path }, true)
    } else {
      this.navigate('/', {}, true)
    }
  }

  /**
   * Handle route errors
   * @param {Error} error - Route error
   * @param {string} path - Current path
   */
  handleError(error, path) {
    console.error('Router error:', error)
    
    appState.actions.showNotification({
      type: 'error',
      title: 'Error de Navegación',
      message: 'Ocurrió un error al cargar la página'
    })
    
    // Try to recover by going to home
    if (path !== '/') {
      this.navigate('/', {}, true)
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Handle browser back/forward
    window.addEventListener('popstate', this.handlePopState)
    
    // Handle link clicks
    document.addEventListener('click', this.handleLinkClick)
  }

  /**
   * Handle popstate event
   * @param {PopStateEvent} event - Popstate event
   */
  handlePopState(event) {
    this.handleRoute(window.location.pathname, event.state)
  }

  /**
   * Handle link clicks for SPA navigation
   * @param {MouseEvent} event - Click event
   */
  handleLinkClick(event) {
    const link = event.target.closest('a[href]')
    
    if (!link) return
    
    const href = link.getAttribute('href')
    
    // Skip external links and special protocols
    if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return
    }
    
    // Skip if modifier keys are pressed
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return
    }
    
    // Skip if target is not _self
    if (link.target && link.target !== '_self') {
      return
    }
    
    // Prevent default and navigate
    event.preventDefault()
    this.navigate(href)
  }

  /**
   * Generate URL for route with parameters
   * @param {string} routePath - Route path pattern
   * @param {Object} params - Route parameters
   * @param {Object} query - Query parameters
   * @returns {string} Generated URL
   */
  url(routePath, params = {}, query = {}) {
    let path = routePath
    
    // Replace parameters
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`:${key}`, encodeURIComponent(value))
    }
    
    // Add query string
    const queryString = new URLSearchParams(query).toString()
    if (queryString) {
      path += `?${queryString}`
    }
    
    return path
  }

  /**
   * Check if current route matches pattern
   * @param {string} pattern - Pattern to match
   * @returns {boolean} Whether current route matches
   */
  isActive(pattern) {
    if (!this.currentRoute) return false
    
    const currentPath = this.currentRoute.path.split('?')[0]
    
    if (pattern === '/') {
      return currentPath === '/'
    }
    
    return currentPath.startsWith(pattern)
  }

  /**
   * Get current route info
   * @returns {Object|null} Current route info
   */
  getCurrentRoute() {
    return this.currentRoute
  }

  /**
   * Destroy router and cleanup
   */
  destroy() {
    window.removeEventListener('popstate', this.handlePopState)
    document.removeEventListener('click', this.handleLinkClick)
  }
}

// Create singleton instance
export const router = new Router()

// Export class for testing
export { Router }
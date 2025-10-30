/**
 * Vitest Test Setup
 * Global test configuration and mocks for Mictla
 */

import { vi } from 'vitest'

// Mock WebXR APIs
global.navigator = {
  ...global.navigator,
  xr: {
    isSessionSupported: vi.fn().mockResolvedValue(true),
    requestSession: vi.fn().mockResolvedValue({
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      requestReferenceSpace: vi.fn().mockResolvedValue({}),
      requestAnimationFrame: vi.fn(),
      end: vi.fn().mockResolvedValue()
    })
  },
  mediaDevices: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: vi.fn().mockReturnValue([{
        stop: vi.fn()
      }])
    }),
    enumerateDevices: vi.fn().mockResolvedValue([])
  },
  language: 'es-MX',
  userLanguage: 'es-MX'
}

// Mock WebGL context for Three.js
const mockWebGLContext = {
  canvas: document.createElement('canvas'),
  drawingBufferWidth: 1024,
  drawingBufferHeight: 768,
  getExtension: vi.fn(),
  getParameter: vi.fn(),
  createShader: vi.fn(),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  createProgram: vi.fn(),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  useProgram: vi.fn(),
  createBuffer: vi.fn(),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  createTexture: vi.fn(),
  bindTexture: vi.fn(),
  texImage2D: vi.fn(),
  texParameteri: vi.fn(),
  clear: vi.fn(),
  clearColor: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  viewport: vi.fn(),
  drawArrays: vi.fn(),
  drawElements: vi.fn()
}

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
  if (contextType === 'webgl' || contextType === 'webgl2') {
    return mockWebGLContext
  }
  return null
})

// Mock IndexedDB
const mockIDBRequest = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  result: null,
  error: null,
  readyState: 'done'
}

const mockIDBDatabase = {
  createObjectStore: vi.fn(),
  transaction: vi.fn().mockReturnValue({
    objectStore: vi.fn().mockReturnValue({
      add: vi.fn().mockReturnValue(mockIDBRequest),
      get: vi.fn().mockReturnValue(mockIDBRequest),
      put: vi.fn().mockReturnValue(mockIDBRequest),
      delete: vi.fn().mockReturnValue(mockIDBRequest),
      getAll: vi.fn().mockReturnValue(mockIDBRequest),
      createIndex: vi.fn()
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }),
  close: vi.fn()
}

global.indexedDB = {
  open: vi.fn().mockReturnValue({
    ...mockIDBRequest,
    result: mockIDBDatabase,
    addEventListener: vi.fn((event, callback) => {
      if (event === 'success') {
        setTimeout(() => callback({ target: { result: mockIDBDatabase } }), 0)
      }
    })
  }),
  deleteDatabase: vi.fn().mockReturnValue(mockIDBRequest)
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock
})

// Mock URL.createObjectURL and revokeObjectURL
global.URL = {
  ...global.URL,
  createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
  revokeObjectURL: vi.fn()
}

// Mock File and FileReader
global.File = class MockFile {
  constructor(chunks, filename, options = {}) {
    this.name = filename
    this.size = options.size !== undefined ? options.size : chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    this.type = options.type || ''
    this.lastModified = Date.now()
  }
}

global.FileReader = class MockFileReader {
  constructor() {
    this.readyState = 0
    this.result = null
    this.error = null
  }
  
  readAsDataURL(file) {
    setTimeout(() => {
      this.readyState = 2
      this.result = 'data:image/jpeg;base64,mock-base64-data'
      this.onload?.({ target: this })
    }, 0)
  }
  
  readAsArrayBuffer(file) {
    setTimeout(() => {
      this.readyState = 2
      this.result = new ArrayBuffer(8)
      this.onload?.({ target: this })
    }, 0)
  }
}

// Mock MediaRecorder for audio recording
global.MediaRecorder = class MockMediaRecorder {
  constructor(stream, options = {}) {
    this.stream = stream
    this.state = 'inactive'
    this.mimeType = options.mimeType || 'audio/webm'
  }
  
  start() {
    this.state = 'recording'
    this.onstart?.()
  }
  
  stop() {
    this.state = 'inactive'
    setTimeout(() => {
      const mockBlob = new Blob(['mock audio data'], { type: this.mimeType })
      this.ondataavailable?.({ data: mockBlob })
      this.onstop?.()
    }, 0)
  }
  
  pause() {
    this.state = 'paused'
    this.onpause?.()
  }
  
  resume() {
    this.state = 'recording'
    this.onresume?.()
  }
}

// Mock ResizeObserver
global.ResizeObserver = class MockResizeObserver {
  constructor(callback) {
    this.callback = callback
  }
  
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock IntersectionObserver
global.IntersectionObserver = class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback
  }
  
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(callback, 16)
})

global.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id)
})

// Mock performance API
global.performance = {
  ...global.performance,
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn().mockReturnValue([])
}

// Mock crypto API for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
    getRandomValues: vi.fn((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256)
      }
      return array
    })
  },
  writable: true
})

// Mock Notification API
global.Notification = class MockNotification {
  constructor(title, options = {}) {
    this.title = title
    this.body = options.body
    this.icon = options.icon
    this.tag = options.tag
  }
  
  static requestPermission() {
    return Promise.resolve('granted')
  }
  
  close() {}
}

// Mock service worker registration
global.navigator.serviceWorker = {
  register: vi.fn().mockResolvedValue({
    installing: null,
    waiting: null,
    active: {
      postMessage: vi.fn()
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }),
  ready: Promise.resolve({
    showNotification: vi.fn()
  })
}

// Mock fetch for network requests
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: vi.fn().mockResolvedValue({}),
  text: vi.fn().mockResolvedValue(''),
  blob: vi.fn().mockResolvedValue(new Blob())
})

// Mock console methods to reduce noise in tests
const originalConsole = { ...console }
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
}

// Restore console for debugging when needed
global.restoreConsole = () => {
  global.console = originalConsole
}

// Mock DOM methods that might not be available in jsdom
Element.prototype.scrollIntoView = vi.fn()
Element.prototype.animate = vi.fn().mockReturnValue({
  finished: Promise.resolve(),
  cancel: vi.fn(),
  pause: vi.fn(),
  play: vi.fn()
})

// Mock CSS.supports
global.CSS = {
  supports: vi.fn().mockReturnValue(true)
}

// Test utilities
export const createMockMemorial = (overrides = {}) => ({
  id: 'memorial_' + Date.now(),
  name: 'Test Memorial',
  relationship: 'padre',
  birthDate: new Date('1950-01-01'),
  deathDate: new Date('2020-01-01'),
  story: 'A loving father and grandfather',
  photo: 'data:image/jpeg;base64,mock-photo-data',
  altarLevel: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  syncStatus: 'local',
  ...overrides
})

export const createMockARSession = () => ({
  isActive: true,
  isSupported: true,
  camera: mockWebGLContext,
  scene: {},
  offerings: []
})

export const waitForNextTick = () => new Promise(resolve => setTimeout(resolve, 0))

// Cleanup function for tests
export const cleanup = () => {
  vi.clearAllMocks()
  localStorageMock.clear()
  document.body.innerHTML = ''
}
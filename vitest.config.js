import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Setup files
    setupFiles: ['./tests/setup.js'],
    
    // Global test utilities
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'public/',
        '**/*.config.js',
        '**/*.config.ts'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    
    // Test file patterns
    include: [
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache'
    ],
    
    // Test timeout
    testTimeout: 10000,
    
    // Mock configuration
    deps: {
      inline: ['three']
    }
  },
  
  // Resolve configuration for tests
  resolve: {
    alias: {
      '@': '/src',
      '@tests': '/tests'
    }
  },
  
  // Define globals for tests
  define: {
    __TEST__: true,
    __APP_VERSION__: JSON.stringify('test'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
})
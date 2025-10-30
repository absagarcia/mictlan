/**
 * Playwright Global Setup
 * Runs once before all tests
 */

import { chromium } from '@playwright/test'

async function globalSetup() {
  console.log('🚀 Starting Mictla E2E test setup...')
  
  // Create a browser instance for setup
  const browser = await chromium.launch()
  const context = await browser.newContext({
    ignoreHTTPSErrors: true
  })
  const page = await context.newPage()
  
  try {
    // Wait for dev server to be ready
    console.log('⏳ Waiting for dev server...')
    await page.goto('https://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    })
    
    // Check if app loads correctly
    await page.waitForSelector('body', { timeout: 10000 })
    console.log('✅ Dev server is ready')
    
    // Setup test data if needed
    await page.evaluate(() => {
      // Clear any existing data
      localStorage.clear()
      sessionStorage.clear()
      
      // Set test environment flag
      localStorage.setItem('mictla-test-mode', 'true')
    })
    
    console.log('✅ Test environment prepared')
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await context.close()
    await browser.close()
  }
  
  console.log('🎉 Global setup completed')
}

export default globalSetup
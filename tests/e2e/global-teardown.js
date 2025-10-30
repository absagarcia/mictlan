/**
 * Playwright Global Teardown
 * Runs once after all tests
 */

async function globalTeardown() {
  console.log('🧹 Starting Mictla E2E test teardown...')
  
  // Cleanup operations if needed
  // For example, clearing test databases, stopping services, etc.
  
  console.log('✅ Global teardown completed')
}

export default globalTeardown
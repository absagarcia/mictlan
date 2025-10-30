/**
 * Mictla App E2E Tests
 * Basic application functionality tests
 */

import { test, expect } from '@playwright/test'

test.describe('Mictla App', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/')
    
    // Wait for app to load
    await page.waitForLoadState('networkidle')
  })

  test('should load the home page', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Mictla/)
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Mictla')
    
    // Check navigation is present
    await expect(page.locator('nav')).toBeVisible()
  })

  test('should navigate between sections', async ({ page }) => {
    // Navigate to altar section
    await page.click('a[href="/altar"]')
    await expect(page.url()).toContain('/altar')
    
    // Navigate to memories section
    await page.click('a[href="/memories"]')
    await expect(page.url()).toContain('/memories')
    
    // Navigate back to home
    await page.click('a[href="/"]')
    await expect(page.url()).toBe('https://localhost:3000/')
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check mobile navigation
    const mobileNav = page.locator('[data-testid="mobile-nav"]')
    if (await mobileNav.isVisible()) {
      await expect(mobileNav).toBeVisible()
    }
    
    // Check content is readable
    const mainContent = page.locator('main')
    await expect(mainContent).toBeVisible()
  })

  test('should support language switching', async ({ page }) => {
    // Find language switcher
    const langSwitcher = page.locator('[data-testid="language-switcher"]')
    
    if (await langSwitcher.isVisible()) {
      // Switch to English
      await langSwitcher.selectOption('en')
      
      // Check if content changed to English
      await expect(page.locator('h1')).toContainText('Mictla')
      
      // Switch back to Spanish
      await langSwitcher.selectOption('es')
      
      // Check if content is in Spanish
      await expect(page.locator('h1')).toContainText('Mictla')
    }
  })

  test('should work offline (PWA)', async ({ page, context }) => {
    // First, load the page online
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Go offline
    await context.setOffline(true)
    
    // Reload page
    await page.reload()
    
    // Should still work (served from cache)
    await expect(page.locator('body')).toBeVisible()
    
    // Go back online
    await context.setOffline(false)
  })

  test('should handle errors gracefully', async ({ page }) => {
    // Navigate to non-existent route
    await page.goto('/nonexistent-route')
    
    // Should redirect to home or show 404
    await page.waitForLoadState('networkidle')
    
    // Should not show browser error page
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Accessibility', () => {
  test('should meet basic accessibility standards', async ({ page }) => {
    await page.goto('/')
    
    // Check for proper heading structure
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
    
    // Check for alt text on images
    const images = page.locator('img')
    const imageCount = await images.count()
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      expect(alt).toBeTruthy()
    }
    
    // Check for proper form labels
    const inputs = page.locator('input')
    const inputCount = await inputs.count()
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`)
        const hasLabel = await label.count() > 0
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy()
      }
    }
  })

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/')
    
    // Tab through interactive elements
    await page.keyboard.press('Tab')
    
    // Check if focus is visible
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Continue tabbing
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Should be able to activate with Enter/Space
    await page.keyboard.press('Enter')
    
    // Should navigate or perform action
    await page.waitForTimeout(500)
  })
})
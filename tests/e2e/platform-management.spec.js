import { test, expect } from '@playwright/test';

test.describe('Platform Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the application to load
    await page.waitForLoadState('networkidle');
    
    // Mock API responses for consistent testing
    await page.route('/api/platforms', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'platform-1',
            name: 'Netflix Supplier',
            description: 'Primary Netflix account supplier',
            contactName: 'John Smith',
            contactEmail: 'john@supplier.com',
            contactPhone: '+1-555-0123',
            creditBalance: 1500,
            lowBalanceThreshold: 500,
            isActive: true,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z'
          },
          {
            id: 'platform-2',
            name: 'Spotify Supplier',
            description: 'Music streaming platform supplier',
            contactName: 'Jane Doe',
            contactEmail: 'jane@musicplatform.com',
            contactPhone: '+1-555-0456',
            creditBalance: 50, // Low balance for testing alerts
            lowBalanceThreshold: 200,
            isActive: true,
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z'
          }
        ])
      });
    });
  });

  test('should display platform list', async ({ page }) => {
    // Navigate to platforms page
    await page.click('text=Platforms');
    await page.click('text=Platform Management');
    
    // Wait for platforms to load
    await page.waitForSelector('[data-testid="platform-card"]');
    
    // Verify platforms are displayed
    await expect(page.locator('text=Netflix Supplier')).toBeVisible();
    await expect(page.locator('text=Spotify Supplier')).toBeVisible();
    
    // Verify platform details
    const netflixCard = page.locator('[data-testid="platform-card"]').filter({ hasText: 'Netflix Supplier' });
    await expect(netflixCard.locator('text=1,500.00 DZD')).toBeVisible();
    await expect(netflixCard.locator('text=Active')).toBeVisible();
  });

  test('should show low credit alerts', async ({ page }) => {
    // Navigate to platforms page
    await page.click('text=Platforms');
    await page.click('text=Platform Management');
    
    // Wait for platforms to load
    await page.waitForSelector('[data-testid="platform-card"]');
    
    // Check for low credit alert
    const spotifyCard = page.locator('[data-testid="platform-card"]').filter({ hasText: 'Spotify Supplier' });
    await expect(spotifyCard.locator('[data-testid="low-credit-alert"]')).toBeVisible();
    await expect(spotifyCard.locator('text=Low Credit')).toBeVisible();
  });

  test('should create new platform', async ({ page }) => {
    // Mock POST request for creating platform
    await page.route('/api/platforms', async route => {
      if (route.request().method() === 'POST') {
        const requestBody = await route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'platform-new',
            ...requestBody,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to platforms page
    await page.click('text=Platforms');
    await page.click('text=Platform Management');
    
    // Click add new platform button
    await page.click('[data-testid="add-platform-button"]');
    
    // Fill in platform form
    await page.fill('[data-testid="platform-name-input"]', 'Test Platform');
    await page.fill('[data-testid="platform-description-input"]', 'Test platform description');
    await page.fill('[data-testid="contact-name-input"]', 'Test Contact');
    await page.fill('[data-testid="contact-email-input"]', 'test@platform.com');
    await page.fill('[data-testid="contact-phone-input"]', '+1-555-0789');
    await page.fill('[data-testid="credit-balance-input"]', '1000');
    await page.fill('[data-testid="low-balance-threshold-input"]', '100');
    
    // Submit form
    await page.click('[data-testid="save-platform-button"]');
    
    // Wait for success message
    await expect(page.locator('text=Platform created successfully')).toBeVisible();
    
    // Verify platform appears in list
    await expect(page.locator('text=Test Platform')).toBeVisible();
  });

  test('should add credits to platform', async ({ page }) => {
    // Mock POST request for adding credits
    await page.route('/api/platforms/platform-1/credits', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          platform: {
            id: 'platform-1',
            creditBalance: 2500 // Updated balance
          },
          movement: {
            id: 'movement-new',
            amount: 1000,
            type: 'credit_added'
          }
        })
      });
    });

    // Navigate to platforms page
    await page.click('text=Platforms');
    await page.click('text=Platform Management');
    
    // Click on Netflix platform
    const netflixCard = page.locator('[data-testid="platform-card"]').filter({ hasText: 'Netflix Supplier' });
    await netflixCard.click();
    
    // Click manage credits button
    await page.click('[data-testid="manage-credits-button"]');
    
    // Click add credits
    await page.click('[data-testid="add-credits-button"]');
    
    // Fill in credit form
    await page.fill('[data-testid="credit-amount-input"]', '1000');
    await page.fill('[data-testid="credit-reference-input"]', 'TEST-CREDIT-001');
    await page.fill('[data-testid="credit-notes-input"]', 'Test credit addition');
    
    // Submit form
    await page.click('[data-testid="add-credits-submit-button"]');
    
    // Wait for success message
    await expect(page.locator('text=Credits added successfully')).toBeVisible();
    
    // Verify updated balance
    await expect(page.locator('text=2,500.00 DZD')).toBeVisible();
  });

  test('should search platforms', async ({ page }) => {
    // Navigate to platforms page
    await page.click('text=Platforms');
    await page.click('text=Platform Management');
    
    // Wait for platforms to load
    await page.waitForSelector('[data-testid="platform-card"]');
    
    // Use search functionality
    await page.fill('[data-testid="platform-search-input"]', 'Netflix');
    
    // Verify filtered results
    await expect(page.locator('text=Netflix Supplier')).toBeVisible();
    await expect(page.locator('text=Spotify Supplier')).not.toBeVisible();
    
    // Clear search
    await page.fill('[data-testid="platform-search-input"]', '');
    
    // Verify all platforms are shown again
    await expect(page.locator('text=Netflix Supplier')).toBeVisible();
    await expect(page.locator('text=Spotify Supplier')).toBeVisible();
  });

  test('should filter platforms by status', async ({ page }) => {
    // Navigate to platforms page
    await page.click('text=Platforms');
    await page.click('text=Platform Management');
    
    // Wait for platforms to load
    await page.waitForSelector('[data-testid="platform-card"]');
    
    // Filter by active platforms
    await page.click('[data-testid="status-filter-dropdown"]');
    await page.click('text=Active Only');
    
    // Verify only active platforms are shown
    await expect(page.locator('text=Netflix Supplier')).toBeVisible();
    await expect(page.locator('text=Spotify Supplier')).toBeVisible();
    
    // Filter by low credit
    await page.click('[data-testid="status-filter-dropdown"]');
    await page.click('text=Low Credit');
    
    // Verify only low credit platforms are shown
    await expect(page.locator('text=Spotify Supplier')).toBeVisible();
    await expect(page.locator('text=Netflix Supplier')).not.toBeVisible();
  });

  test('should edit platform details', async ({ page }) => {
    // Mock PUT request for updating platform
    await page.route('/api/platforms/platform-1', async route => {
      if (route.request().method() === 'PUT') {
        const requestBody = await route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'platform-1',
            name: requestBody.name,
            description: requestBody.description,
            contactName: 'John Smith',
            contactEmail: 'john@supplier.com',
            contactPhone: '+1-555-0123',
            creditBalance: 1500,
            lowBalanceThreshold: requestBody.lowBalanceThreshold,
            isActive: true,
            updatedAt: new Date().toISOString()
          })
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to platforms page
    await page.click('text=Platforms');
    await page.click('text=Platform Management');
    
    // Click on Netflix platform
    const netflixCard = page.locator('[data-testid="platform-card"]').filter({ hasText: 'Netflix Supplier' });
    await netflixCard.click();
    
    // Click edit button
    await page.click('[data-testid="edit-platform-button"]');
    
    // Update platform details
    await page.fill('[data-testid="platform-name-input"]', 'Updated Netflix Supplier');
    await page.fill('[data-testid="platform-description-input"]', 'Updated description');
    await page.fill('[data-testid="low-balance-threshold-input"]', '300');
    
    // Save changes
    await page.click('[data-testid="save-platform-button"]');
    
    // Wait for success message
    await expect(page.locator('text=Platform updated successfully')).toBeVisible();
    
    // Verify updated details
    await expect(page.locator('text=Updated Netflix Supplier')).toBeVisible();
    await expect(page.locator('text=Updated description')).toBeVisible();
  });

  test('should display credit movement history', async ({ page }) => {
    // Mock credit movements API
    await page.route('/api/platforms/platform-1/credits/movements', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'movement-1',
            type: 'credit_added',
            amount: 1000,
            previousBalance: 500,
            newBalance: 1500,
            reference: 'BANK-TRANSFER-001',
            description: 'Monthly credit top-up',
            createdAt: '2025-01-01T00:00:00Z'
          },
          {
            id: 'movement-2',
            type: 'sale_deduction',
            amount: -15,
            previousBalance: 1515,
            newBalance: 1500,
            reference: 'SALE-001',
            description: 'Credit deduction for sale',
            createdAt: '2025-01-15T10:30:00Z'
          }
        ])
      });
    });

    // Navigate to platforms page
    await page.click('text=Platforms');
    await page.click('text=Platform Management');
    
    // Click on Netflix platform
    const netflixCard = page.locator('[data-testid="platform-card"]').filter({ hasText: 'Netflix Supplier' });
    await netflixCard.click();
    
    // Click credit history tab
    await page.click('[data-testid="credit-history-tab"]');
    
    // Verify credit movements are displayed
    await expect(page.locator('text=BANK-TRANSFER-001')).toBeVisible();
    await expect(page.locator('text=+1,000.00 DZD')).toBeVisible();
    await expect(page.locator('text=SALE-001')).toBeVisible();
    await expect(page.locator('text=-15.00 DZD')).toBeVisible();
  });

  test('should handle platform deletion', async ({ page }) => {
    // Mock DELETE request
    await page.route('/api/platforms/platform-1', async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 204
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to platforms page
    await page.click('text=Platforms');
    await page.click('text=Platform Management');
    
    // Click on Netflix platform
    const netflixCard = page.locator('[data-testid="platform-card"]').filter({ hasText: 'Netflix Supplier' });
    await netflixCard.click();
    
    // Click delete button
    await page.click('[data-testid="delete-platform-button"]');
    
    // Confirm deletion in modal
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Wait for success message
    await expect(page.locator('text=Platform deleted successfully')).toBeVisible();
    
    // Verify platform is removed from list
    await expect(page.locator('text=Netflix Supplier')).not.toBeVisible();
  });

  test('should validate form inputs', async ({ page }) => {
    // Navigate to platforms page
    await page.click('text=Platforms');
    await page.click('text=Platform Management');
    
    // Click add new platform button
    await page.click('[data-testid="add-platform-button"]');
    
    // Try to submit empty form
    await page.click('[data-testid="save-platform-button"]');
    
    // Verify validation errors
    await expect(page.locator('text=Platform name is required')).toBeVisible();
    await expect(page.locator('text=Contact name is required')).toBeVisible();
    await expect(page.locator('text=Contact email is required')).toBeVisible();
    
    // Fill invalid email
    await page.fill('[data-testid="contact-email-input"]', 'invalid-email');
    await page.click('[data-testid="save-platform-button"]');
    
    // Verify email validation
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
    
    // Fill negative credit balance
    await page.fill('[data-testid="credit-balance-input"]', '-100');
    await page.click('[data-testid="save-platform-button"]');
    
    // Verify credit balance validation
    await expect(page.locator('text=Credit balance must be positive')).toBeVisible();
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to platforms page
    await page.click('text=Platforms');
    await page.click('text=Platform Management');
    
    // Wait for platforms to load
    await page.waitForSelector('[data-testid="platform-card"]');
    
    // Verify mobile layout
    const platformCard = page.locator('[data-testid="platform-card"]').first();
    await expect(platformCard).toBeVisible();
    
    // Verify mobile navigation works
    await platformCard.click();
    await expect(page.locator('[data-testid="platform-details"]')).toBeVisible();
    
    // Test mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  });
});

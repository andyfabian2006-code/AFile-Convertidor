import { test, expect } from '@playwright/test';

test.describe('Image Conversion E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local dev server (assuming it runs on localhost:5173 for vite)
    await page.goto('/');
  });

  test('Page loads and dropzone is visible', async ({ page }) => {
    await expect(page.locator('#dropzone')).toBeVisible();
    await expect(page.locator('#convert-btn')).toBeDisabled();
    await expect(page.locator('h1')).toContainText('Convierte archivos al instante');
  });

  test('Drop SVG and select output format', async ({ page }) => {
    // Create a mock SVG file content
    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="red"/></svg>';
    const buffer = Buffer.from(svgContent);
    
    // Set files on the input
    await page.setInputFiles('#file-input', {
      name: 'test.svg',
      mimeType: 'image/svg+xml',
      buffer: buffer
    });

    // Verify UI updates
    await expect(page.locator('#dz-filename')).toContainText('test.svg');
    await expect(page.locator('#dz-file-details')).toContainText('Detectado: SVG');
    
    // Check format select
    const formatSelect = page.locator('#format-select');
    await expect(formatSelect).toBeEnabled();
    
    // Select JPG and verify button enables
    await formatSelect.selectOption('JPG');
    await expect(page.locator('#convert-btn')).toBeEnabled();
  });
});

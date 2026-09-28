import { test, expect } from '@playwright/test';

test.describe('Gestión de Cookies y Privacidad', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/');
  });

  test('Debería mostrar el banner de cookies al inicio si no hay consentimiento', async ({ page }) => {
    const banner = page.locator('#cookie-banner');
    await expect(banner).toBeVisible();
    await expect(page.locator('#btn-accept-cookies')).toBeVisible();
    await expect(page.locator('#btn-reject-cookies')).toBeVisible();
  });

  test('No debería cargar scripts de terceros por defecto', async ({ page }) => {
    // Check that posthog and AdSense scripts are not in the DOM
    const hasPosthog = await page.evaluate(() => !!window.posthog);
    expect(hasPosthog).toBe(false);

    const adsenseScripts = await page.locator('script[src*="adsbygoogle.js"]').count();
    expect(adsenseScripts).toBe(0);
  });

  test('Debería inyectar scripts al aceptar cookies y ocultar el banner', async ({ page }) => {
    await page.click('#btn-accept-cookies');
    
    // Banner should disappear (it has a 300ms fade out, so we wait for it to be hidden)
    const banner = page.locator('#cookie-banner');
    await expect(banner).toBeHidden();

    // Verify localStorage
    const consent = await page.evaluate(() => window.localStorage.getItem('afile_cookie_consent'));
    expect(consent).toBe('accepted');

    // Verify scripts injected
    const adsenseScripts = await page.locator('script[src*="adsbygoogle.js"]').count();
    expect(adsenseScripts).toBe(1);
    
    // Posthog takes a bit to initialize in window
    await page.waitForFunction(() => !!window.posthog);
    const hasPosthog = await page.evaluate(() => !!window.posthog);
    expect(hasPosthog).toBe(true);
  });

  test('Debería guardar rechazo y no inyectar scripts al rechazar', async ({ page }) => {
    await page.click('#btn-reject-cookies');
    
    const banner = page.locator('#cookie-banner');
    await expect(banner).toBeHidden();

    const consent = await page.evaluate(() => window.localStorage.getItem('afile_cookie_consent'));
    expect(consent).toBe('rejected');

    const adsenseScripts = await page.locator('script[src*="adsbygoogle.js"]').count();
    expect(adsenseScripts).toBe(0);
  });
});

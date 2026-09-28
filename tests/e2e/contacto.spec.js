import { test, expect } from '@playwright/test';

test.describe('Formulario de Contacto', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/contacto.html');
  });

  test('Debería renderizar todos los campos obligatorios', async ({ page }) => {
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#message')).toBeVisible();
    await expect(page.locator('#submit-btn')).toBeVisible();
  });

  test('Debería validar que los campos estén completos antes de enviar', async ({ page }) => {
    // Intenta enviar vacío
    await page.click('#submit-btn');
    
    // Al ser un form nativo con 'required', el navegador bloquea el envío y muestra un tooltip nativo.
    // Una forma de verificar que no se hizo la petición fetch es validar que el estado del botón no cambió a 'Enviando...'
    await expect(page.locator('#submit-btn')).toHaveText('Enviar Mensaje');
  });

  test('Debería mostrar error si Turnstile no está resuelto al interceptar submit', async ({ page }) => {
    // Fill form
    await page.fill('#name', 'Test User');
    await page.fill('#email', 'test@example.com');
    await page.fill('#message', 'Este es un mensaje de prueba.');
    
    // Turnstile requires real interaction or specific test keys to solve automatically.
    // En este test, forzaremos el submit por JS para saltar el HTML5 validation si es necesario, 
    // pero como los llenamos, debería pasar el HTML5 validation y llegar al JS.
    
    await page.click('#submit-btn');

    // Dado que no interactuamos con Turnstile, debería mostrar el error custom del JS.
    const alertBox = page.locator('#contact-alert');
    await expect(alertBox).toBeVisible();
    await expect(alertBox).toContainText('completa la verificación de seguridad');
  });
});

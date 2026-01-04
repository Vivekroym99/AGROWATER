import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login');

      // Check page elements - using actual Polish UI text
      await expect(page.getByRole('heading', { name: /zaloguj się/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/hasło/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /zaloguj/i })).toBeVisible();
    });

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/login');

      // Try to submit empty form
      await page.getByRole('button', { name: /zaloguj/i }).click();

      // Should show validation errors - look for error styling (red text) or error message
      // The form uses Zod validation which shows "Nieprawidłowy adres email"
      const errorText = page.locator('.text-red-600, .text-red-500, [class*="error"]');
      await expect(errorText.first()).toBeVisible({ timeout: 5000 });
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      // Fill in invalid credentials
      await page.getByLabel(/email/i).fill('invalid@example.com');
      await page.getByLabel(/hasło/i).fill('wrongpassword');
      await page.getByRole('button', { name: /zaloguj/i }).click();

      // Should show error message (wait longer for API call)
      // Look for error alert container (red background with error icon)
      const errorAlert = page.locator('.bg-red-50, [class*="error"], [role="alert"]');
      await expect(errorAlert.first()).toBeVisible({ timeout: 15000 });
    });

    test('should have link to register page', async ({ page }) => {
      await page.goto('/login');

      const registerLink = page.getByRole('link', { name: /zarejestruj/i });
      await expect(registerLink).toBeVisible();
      await registerLink.click();

      await expect(page).toHaveURL(/\/register/);
    });
  });

  test.describe('Register Page', () => {
    test('should display registration form', async ({ page }) => {
      await page.goto('/register');

      // Check page elements - using actual Polish UI text
      await expect(page.getByRole('heading', { name: /zarejestruj się/i })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/hasło/i)).toBeVisible();
      await expect(page.getByLabel(/imię i nazwisko/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /zarejestruj/i })).toBeVisible();
    });

    test('should show validation error for short password', async ({ page }) => {
      await page.goto('/register');

      // Fill form with short password
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/hasło/i).fill('short');
      await page.getByLabel(/imię i nazwisko/i).fill('Jan Kowalski');
      await page.getByRole('checkbox').check();
      await page.getByRole('button', { name: /zarejestruj/i }).click();

      // Should show password validation error
      await expect(page.locator('text=/minimum 8|8 znaków/i')).toBeVisible();
    });

    test('should require terms acceptance', async ({ page }) => {
      await page.goto('/register');

      // Fill form without checking terms
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/hasło/i).fill('password123');
      await page.getByLabel(/imię i nazwisko/i).fill('Jan Kowalski');
      await page.getByRole('button', { name: /zarejestruj/i }).click();

      // Should show terms validation error
      await expect(page.locator('text=/wymagane|required/i')).toBeVisible();
    });

    test('should have link to login page', async ({ page }) => {
      await page.goto('/register');

      const loginLink = page.getByRole('link', { name: /zaloguj/i });
      await expect(loginLink).toBeVisible();
      await loginLink.click();

      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
      await page.goto('/dashboard');

      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect to login when accessing fields without auth', async ({ page }) => {
      await page.goto('/fields');

      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);
    });

    test('should redirect to login when accessing settings without auth', async ({ page }) => {
      await page.goto('/settings');

      // Should be redirected to login
      await expect(page).toHaveURL(/\/login/);
    });
  });
});

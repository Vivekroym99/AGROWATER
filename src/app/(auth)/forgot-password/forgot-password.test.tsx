import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Supabase client
const mockResetPasswordForEmail = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  }),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Import after mocks
import ForgotPasswordPage from './page';

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the form with email input', () => {
      render(<ForgotPasswordPage />);

      expect(screen.getByText('Resetowanie hasla')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /wyslij link/i })).toBeInTheDocument();
    });

    it('should have a link back to login', () => {
      render(<ForgotPasswordPage />);

      const loginLink = screen.getByText('Powrot do logowania');
      expect(loginLink).toBeInTheDocument();
      expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
    });

    it('should show helper text', () => {
      render(<ForgotPasswordPage />);

      expect(screen.getByText(/podaj adres email/i)).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('should show error for invalid email format', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByRole('textbox');
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /wyslij link/i });
      await user.click(submitButton);

      await waitFor(() => {
        // UI_TEXT.errors.invalidEmail = 'Nieprawidłowy adres email'
        expect(screen.getByText(/adres email/i)).toBeInTheDocument();
      });
    });

    it('should show error for empty email', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);

      const submitButton = screen.getByRole('button', { name: /wyslij link/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Zod validation error for invalid email (empty string fails email validation)
        expect(screen.getByText(/adres email/i)).toBeInTheDocument();
      });
    });
  });

  describe('form submission', () => {
    it('should call resetPasswordForEmail with correct email', async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });
      const user = userEvent.setup();

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByRole('textbox');
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /wyslij link/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
          redirectTo: expect.stringContaining('/reset-password'),
        });
      });
    });

    it('should show success message after submission', async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });
      const user = userEvent.setup();

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByRole('textbox');
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /wyslij link/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/sprawdz email/i)).toBeInTheDocument();
        expect(screen.getByText(/link do resetowania hasla/i)).toBeInTheDocument();
      });
    });

    it('should show error message on API error', async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({
        error: { message: 'User not found' },
      });
      const user = userEvent.setup();

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByRole('textbox');
      await user.type(emailInput, 'notfound@example.com');

      const submitButton = screen.getByRole('button', { name: /wyslij link/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/User not found/i)).toBeInTheDocument();
      });
    });

    it('should show loading state while submitting', async () => {
      mockResetPasswordForEmail.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 500))
      );
      const user = userEvent.setup();

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByRole('textbox');
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /wyslij link/i });
      await user.click(submitButton);

      // Button should be disabled during loading
      expect(submitButton).toBeDisabled();
    });

    it('should show success state with check icon', async () => {
      mockResetPasswordForEmail.mockResolvedValueOnce({ error: null });
      const user = userEvent.setup();

      render(<ForgotPasswordPage />);

      const emailInput = screen.getByRole('textbox');
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /wyslij link/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Sprawdz email')).toBeInTheDocument();
        expect(screen.getByText(/wygasa po 24 godzinach/i)).toBeInTheDocument();
      });
    });
  });
});

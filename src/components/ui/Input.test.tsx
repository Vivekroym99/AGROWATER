import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './Input';

describe('Input component', () => {
  it('should render input element', () => {
    render(<Input name="test" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render with label', () => {
    render(<Input label="Email" name="email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('should show required indicator when required', () => {
    render(<Input label="Email" name="email" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should display error message', () => {
    render(<Input label="Email" name="email" error="Invalid email" />);
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('should apply error styles when error is present', () => {
    render(<Input name="email" error="Invalid" />);
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
  });

  it('should handle value changes', () => {
    const handleChange = vi.fn();
    render(<Input name="test" onChange={handleChange} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('should use name as id when id not provided', () => {
    render(<Input name="username" label="Username" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'username');
  });

  it('should use provided id over name', () => {
    render(<Input id="custom-id" name="username" label="Username" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'custom-id');
  });

  it('should apply custom className', () => {
    render(<Input name="test" className="custom-class" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-class');
  });

  it('should support different input types', () => {
    const { container } = render(<Input name="password" type="password" />);
    const input = container.querySelector('input[type="password"]');
    expect(input).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input name="test" disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('should display placeholder', () => {
    render(<Input name="test" placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should forward ref correctly', () => {
    const ref = vi.fn();
    render(<Input name="test" ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ApiKeyCard } from './ApiKeyCard';

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('ApiKeyCard', () => {
  const mockRegenerate = jest.fn();
  const testApiKey = 'test-api-key-12345';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with an API key', () => {
    render(<ApiKeyCard apiKey={testApiKey} error={null} onRegenerate={mockRegenerate} />);
    
    expect(screen.getByText('API Key')).toBeInTheDocument();
    expect(screen.getByText('Use this key to authenticate your API requests. Keep it secret!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /regenerate key/i })).toBeInTheDocument();
  });

  it('displays error message when there is an error', () => {
    const errorMessage = 'Failed to load API key';
    render(<ApiKeyCard apiKey={null} error={errorMessage} onRegenerate={mockRegenerate} />);
    
    expect(screen.getByText('Error:')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Could not load the API Key. Please try refreshing the page.')).toBeInTheDocument();
  });

  it('toggles API key visibility when eye icon is clicked', () => {
    render(<ApiKeyCard apiKey={testApiKey} error={null} onRegenerate={mockRegenerate} />);
    
    // Initially the input should be a password field (hidden)
    const inputElement = screen.getByRole('textbox') as HTMLInputElement;
    expect(inputElement.type).toBe('password');
    
    // Click the eye icon to show the API key
    const toggleVisibilityButton = screen.getByRole('button', { name: '' }); // Eye icon button
    fireEvent.click(toggleVisibilityButton);
    
    // Now the input should be a text field (visible)
    expect(inputElement.type).toBe('text');
    expect(inputElement.value).toBe(testApiKey);
    
    // Click again to hide
    fireEvent.click(toggleVisibilityButton);
    expect(inputElement.type).toBe('password');
  });

  it('copies API key to clipboard when copy button is clicked', () => {
    render(<ApiKeyCard apiKey={testApiKey} error={null} onRegenerate={mockRegenerate} />);
    
    // Find and click the copy button
    const copyButton = screen.getByRole('button', { name: '' }); // Copy icon button
    fireEvent.click(copyButton);
    
    // Check if clipboard API was called with the correct API key
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testApiKey);
  });

  it('calls onRegenerate when regenerate button is confirmed', () => {
    render(<ApiKeyCard apiKey={testApiKey} error={null} onRegenerate={mockRegenerate} />);
    
    // Click the regenerate button to open the dialog
    const regenerateButton = screen.getByRole('button', { name: /regenerate key/i });
    fireEvent.click(regenerateButton);
    
    // Confirm the regeneration
    const confirmButton = screen.getByRole('button', { name: /yes, regenerate key/i });
    fireEvent.click(confirmButton);
    
    // Check if the onRegenerate callback was called
    expect(mockRegenerate).toHaveBeenCalledTimes(1);
  });
}); 
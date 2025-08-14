import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ThemeProvider } from '../context/ThemeContext';
import ThemeToggleButton from './ThemeToggleButton';

describe('ThemeToggleButton', () => {
  it('should toggle theme on click', () => {
    render(
      <ThemeProvider>
        <ThemeToggleButton />
      </ThemeProvider>
    );

    // Initial state
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Mode Contraste');

    // Click the button
    fireEvent.click(button);

    // After click
    expect(button).toHaveTextContent('Mode Normal');

    // Click again to go back
    fireEvent.click(button);
    expect(button).toHaveTextContent('Mode Contraste');
  });
});

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// A simple component to test
function HelloWorld() {
  return <h1>Hello, World!</h1>;
}

describe('Example test', () => {
  it('renders hello world', () => {
    render(<HelloWorld />);
    expect(screen.getByText('Hello, World!')).toBeInTheDocument();
  });

  it('basic test', () => {
    expect(1 + 1).toBe(2);
  });
}); 
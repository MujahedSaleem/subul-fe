# Project Testing Documentation

This project uses Vitest with React Testing Library for testing React components and hooks.

## Running Tests

To run all tests:

```bash
npm test
```

To run tests in watch mode (for development):

```bash
npm run test:watch
```

To run tests with coverage report:

```bash
npm run test:coverage
```

## Test Structure

Tests are located in the `src/test` directory. The naming convention is `*.test.tsx` for component tests and `*.test.ts` for utility and hook tests.

## Writing Tests

### Component Tests

For component tests, we use React Testing Library to render components and assert on their behavior:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import YourComponent from '../path/to/YourComponent';

describe('YourComponent', () => {
  it('renders correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Hook Tests

For hook tests, we use the `renderHook` function from React Testing Library:

```tsx
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useYourHook } from '../path/to/useYourHook';

describe('useYourHook', () => {
  it('returns expected values', () => {
    const { result } = renderHook(() => useYourHook());
    expect(result.current.someValue).toBe(expectedValue);
  });
});
```

## Mocking

Vitest provides built-in mocking capabilities:

```tsx
import { vi } from 'vitest';

// Mock a module
vi.mock('../path/to/module', () => ({
  default: vi.fn(),
  namedExport: vi.fn()
}));

// Create a spy
const spy = vi.fn();
```

## Redux Testing

For components that use Redux, wrap them in a Provider with a mock store:

```tsx
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import yourReducer from '../path/to/yourReducer';

const mockStore = configureStore({
  reducer: {
    yourReducer
  }
});

render(
  <Provider store={mockStore}>
    <YourComponent />
  </Provider>
);
``` 
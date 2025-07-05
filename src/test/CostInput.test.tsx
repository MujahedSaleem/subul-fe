import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CostInput from '../components/CostInput';

describe('CostInput component', () => {
  it('renders correctly with initial value', () => {
    const setOrderMock = vi.fn();
    render(<CostInput cost={100} setOrder={setOrderMock} disabled={false} />);
    
    const input = screen.getByLabelText('التكلفة') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('100');
  });

  it('renders correctly with undefined value', () => {
    const setOrderMock = vi.fn();
    render(<CostInput cost={undefined} setOrder={setOrderMock} disabled={false} />);
    
    const input = screen.getByLabelText('التكلفة') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('');
  });

  it('calls setOrder when input changes', () => {
    const setOrderMock = vi.fn();
    render(<CostInput cost={100} setOrder={setOrderMock} disabled={false} />);
    
    const input = screen.getByLabelText('التكلفة');
    fireEvent.change(input, { target: { value: '200' } });
    
    expect(setOrderMock).toHaveBeenCalled();
    expect(setOrderMock).toHaveBeenCalledWith(expect.any(Function));
  });

  it('disables input when disabled prop is true', () => {
    const setOrderMock = vi.fn();
    render(<CostInput cost={100} setOrder={setOrderMock} disabled={true} />);
    
    const input = screen.getByLabelText('التكلفة') as HTMLInputElement;
    expect(input).toBeDisabled();
  });
}); 
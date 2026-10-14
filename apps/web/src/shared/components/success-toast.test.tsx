import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { SuccessToast, TOAST_DURATION_MS } from './success-toast';

describe('SuccessToast', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('no se renderiza cuando está cerrado', () => {
    render(<SuccessToast {...defaultProps} open={false} />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('muestra la confirmación con role status', () => {
    render(<SuccessToast {...defaultProps} />);

    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(screen.getByText('Radar actualizado')).toBeInTheDocument();
  });

  it('se cierra solo después de TOAST_DURATION_MS', () => {
    const onClose = jest.fn();
    render(<SuccessToast {...defaultProps} onClose={onClose} />);

    act(() => {
      jest.advanceTimersByTime(TOAST_DURATION_MS - 1);
    });
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

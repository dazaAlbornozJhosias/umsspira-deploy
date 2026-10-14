import { renderHook, act } from '@testing-library/react';
import { useCountdown } from './use-countdown';

describe('useCountdown Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debe inicializarse con los segundos dados y formato MM:SS correcto', () => {
    const { result } = renderHook(() =>
      useCountdown({ initialSeconds: 300, autoStart: false })
    );

    expect(result.current.secondsLeft).toBe(300);
    expect(result.current.formattedTime).toBe('05:00');
    expect(result.current.isExpired).toBe(false);
  });

  it('debe descontar segundos correctamente con el paso del tiempo', () => {
    const { result } = renderHook(() =>
      useCountdown({ initialSeconds: 30, autoStart: true })
    );

    expect(result.current.secondsLeft).toBe(30);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.secondsLeft).toBe(25);
    expect(result.current.formattedTime).toBe('00:25');
  });

  it('debe marcar isExpired en true y llamar a onExpire al llegar a cero', () => {
    const onExpireMock = jest.fn();
    const { result } = renderHook(() =>
      useCountdown({ initialSeconds: 3, autoStart: true, onExpire: onExpireMock })
    );

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isExpired).toBe(true);
    expect(result.current.formattedTime).toBe('00:00');
    expect(onExpireMock).toHaveBeenCalledTimes(1);
  });

  it('debe reiniciar los segundos al llamar a reset', () => {
    const { result } = renderHook(() =>
      useCountdown({ initialSeconds: 10, autoStart: true })
    );

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.secondsLeft).toBe(5);

    act(() => {
      result.current.reset(30);
    });

    expect(result.current.secondsLeft).toBe(30);
    expect(result.current.formattedTime).toBe('00:30');
  });
});

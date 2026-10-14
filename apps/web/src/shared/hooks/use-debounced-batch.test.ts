import { renderHook, act, waitFor } from '@testing-library/react';
import { useDebouncedBatch, DEBOUNCE_MS } from './use-debounced-batch';

describe('useDebouncedBatch Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('agrupa múltiples guardados en un solo envío tras el debounce', async () => {
    const onBatch = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useDebouncedBatch(onBatch, DEBOUNCE_MS));

    act(() => {
      result.current.add({ area: 'software-development', weight: 3 });
      result.current.add({ area: 'cloud-devops', weight: 4 });
      result.current.add({ area: 'data-ai', weight: 5 });
    });

    expect(onBatch).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(DEBOUNCE_MS + 100);
    });

    await waitFor(() => {
      expect(onBatch).toHaveBeenCalledTimes(1);
    });

    expect(onBatch).toHaveBeenCalledWith([
      { area: 'software-development', weight: 3 },
      { area: 'cloud-devops', weight: 4 },
      { area: 'data-ai', weight: 5 },
    ]);
  });

  it('flush envía los cambios pendientes inmediatamente', async () => {
    const onBatch = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useDebouncedBatch(onBatch, DEBOUNCE_MS));

    act(() => {
      result.current.add({ area: 'software-development', weight: 3 });
    });

    expect(onBatch).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.flush();
    });

    expect(onBatch).toHaveBeenCalledTimes(1);
    expect(onBatch).toHaveBeenCalledWith([{ area: 'software-development', weight: 3 }]);
  });

  it('no envía nada si no hay cambios pendientes', async () => {
    const onBatch = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useDebouncedBatch(onBatch, DEBOUNCE_MS));

    await act(async () => {
      await result.current.flush();
    });

    expect(onBatch).not.toHaveBeenCalled();
  });

  it('envía cambios pendientes al desmontar y el timer no dispara un segundo envío', async () => {
    const onBatch = jest.fn().mockResolvedValue(undefined);
    const { result, unmount } = renderHook(() => useDebouncedBatch(onBatch, DEBOUNCE_MS));

    act(() => {
      result.current.add({ area: 'software-development', weight: 3 });
    });

    unmount();

    await act(async () => {
      await Promise.resolve();
    });

    expect(onBatch).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(DEBOUNCE_MS + 100);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(onBatch).toHaveBeenCalledTimes(1);
  });

  it('si el guardado falla, los cambios quedan en la cola y hasPending vuelve a true', async () => {
    const onBatch = jest.fn().mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useDebouncedBatch(onBatch, DEBOUNCE_MS));

    act(() => {
      result.current.add({ area: 'software-development', weight: 3 });
    });

    expect(result.current.hasPending).toBe(true);

    await act(async () => {
      await result.current.flush().catch(() => undefined);
    });

    expect(result.current.hasPending).toBe(true);

    onBatch.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.flush();
    });

    expect(result.current.hasPending).toBe(false);
    expect(onBatch).toHaveBeenCalledTimes(2);
  });

  it('flush espera a que termine un guardado en vuelo antes de continuar', async () => {
    let resolveFirst: (() => void) | undefined;
    const onBatch = jest.fn().mockImplementationOnce(
      () => new Promise<void>((resolve) => { resolveFirst = resolve; })
    ).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDebouncedBatch(onBatch, DEBOUNCE_MS));

    act(() => {
      result.current.add({ area: 'software-development', weight: 3 });
    });

    let firstFlushDone = false;
    act(() => {
      result.current.flush().then(() => { firstFlushDone = true; });
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(firstFlushDone).toBe(false);

    await act(async () => {
      resolveFirst?.();
      await Promise.resolve();
    });

    expect(firstFlushDone).toBe(true);
  });

  it('el timer no genera unhandled rejection cuando el guardado falla', async () => {
    const onBatch = jest.fn().mockRejectedValue(new Error('Network error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const { result } = renderHook(() => useDebouncedBatch(onBatch, DEBOUNCE_MS));

    act(() => {
      result.current.add({ area: 'software-development', weight: 3 });
    });

    act(() => {
      jest.advanceTimersByTime(DEBOUNCE_MS + 100);
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(onBatch).toHaveBeenCalledTimes(1);
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});

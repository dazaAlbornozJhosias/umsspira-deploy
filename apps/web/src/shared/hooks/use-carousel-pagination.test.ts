import { renderHook, act } from '@testing-library/react';
import { useCarouselPagination } from './use-carousel-pagination';

describe('useCarouselPagination', () => {
  it('inicializa correctamente en 0 y avanza', () => {
    const { result } = renderHook(() => useCarouselPagination(8));
    expect(result.current.currentIndex).toBe(0);

    act(() => {
      result.current.handleNext();
    });
    expect(result.current.currentIndex).toBe(3);
  });

  it('no avanza más allá del límite', () => {
    const { result } = renderHook(() => useCarouselPagination(4));
    act(() => {
      result.current.handleNext(); // va a 3
    });
    act(() => {
      result.current.handleNext(); // intenta ir más allá, debe quedarse en un índice válido
    });
    expect(result.current.currentIndex).toBe(1);
  });

  it('retrocede correctamente sin bajar de 0', () => {
    const { result } = renderHook(() => useCarouselPagination(8));
    act(() => {
      result.current.handleNext(); // va a 3
    });
    act(() => {
      result.current.handlePrev(); // vuelve a 0
    });
    expect(result.current.currentIndex).toBe(0);

    act(() => {
      result.current.handlePrev(); // intenta bajar de 0
    });
    expect(result.current.currentIndex).toBe(0);
  });

  it('reinicia la paginación al buscar', () => {
    const { result } = renderHook(() => useCarouselPagination(8));
    act(() => {
      result.current.handleNext();
    });
    act(() => {
      result.current.resetPagination();
    });
    expect(result.current.currentIndex).toBe(0);
  });
});
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { InterestConfiguration } from '../model/mentor-interests';
import { DIRECTORY_PAGE_SIZE, emptyDirectoryFilters, uniqueMentors, type DirectoryPage } from '../model/mentor-directory';
import { getMentorDirectory } from '../services/mentor-directory-api';
import { SessionError } from '@/shared/services/auth-session';

const emptyPage: DirectoryPage = { mentors: [], total: 0, catalog: [], interestsSupported: false };

export function useMentorDirectory() {
  const [page, setPage] = useState<DirectoryPage>(emptyPage);
  const [filters, setFilters] = useState(emptyDirectoryFilters);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionRequired, setSessionRequired] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const request = useRef<AbortController | null>(null);
  const nextOffset = useRef(0);

  useEffect(() => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    nextOffset.current = 0;
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setSessionRequired(false);
    setMoreError(null);
    void getMentorDirectory({ ...filters, offset: 0, limit: DIRECTORY_PAGE_SIZE }, controller.signal)
      .then(result => {
        if (controller.signal.aborted) return;
        nextOffset.current = DIRECTORY_PAGE_SIZE;
        setPage({ ...result, mentors: uniqueMentors(result.mentors) });
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : 'Revisa tu conexión e inténtalo nuevamente.');
          setSessionRequired(reason instanceof SessionError && reason.status === 401);
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filters, attempt]);

  const applyFilters = useCallback((selection: InterestConfiguration) => {
    // Invalidate a pending page immediately, before React runs the next effect.
    request.current?.abort();
    setFilters({ areaIds: [...selection.areaIds], topicIds: [...selection.topicIds] });
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || nextOffset.current >= page.total || request.current?.signal.aborted) return;
    const controller = new AbortController();
    request.current?.abort();
    request.current = controller;
    setLoadingMore(true);
    setMoreError(null);
    try {
      const result = await getMentorDirectory({ ...filters, offset: nextOffset.current, limit: DIRECTORY_PAGE_SIZE }, controller.signal);
      if (controller.signal.aborted) return;
      nextOffset.current += DIRECTORY_PAGE_SIZE;
      setPage(current => ({ ...result, mentors: uniqueMentors([...current.mentors, ...result.mentors]) }));
    } catch (reason) {
      if (!controller.signal.aborted) setMoreError(reason instanceof Error ? reason.message : 'No se pudieron cargar más mentores.');
    } finally {
      if (!controller.signal.aborted) setLoadingMore(false);
    }
  }, [filters, loading, loadingMore, page.total]);

  useEffect(() => () => request.current?.abort(), []);

  return {
    ...page, filters, loading, loadingMore, error, moreError, sessionRequired,
    hasMore: nextOffset.current < page.total, applyFilters, loadMore,
    retry: () => setAttempt(value => value + 1),
  };
}

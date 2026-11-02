'use client';

import { useEffect, useState } from 'react';
import type { Graduate } from '../data/graduates.mock';
import { getGraduates } from '../services/reports.service';
import {
  isSessionExpiredError,
  notifySessionExpired,
} from '@/modules/auth/frontend/services/session-expired';

export function useGraduates() {
  const [data, setData] = useState<Graduate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadGraduates() {
      try {
        setLoading(true);
        setError(null);
        setData(await getGraduates());
      } catch (reason) {
        setData([]);
        if (isSessionExpiredError(reason)) {
          notifySessionExpired();
          return;
        }
        setError('No se pudo cargar el padrón de titulados');
      } finally {
        setLoading(false);
      }
    }

    void loadGraduates();
  }, []);

  return {
    data,
    loading,
    error,
  };
}

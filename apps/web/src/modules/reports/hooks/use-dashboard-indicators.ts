"use client";

import { useEffect, useState } from "react";
import {
  DashboardIndicators,
  getDashboardIndicators,
} from "../services/reports.service";

export function useDashboardIndicators() {
  const [data, setData] = useState<DashboardIndicators | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadIndicators() {
      try {
        setLoading(true);
        setError(null);

        const indicators = await getDashboardIndicators();
        setData(indicators);
      } catch {
        setError("No se pudieron cargar los indicadores");
      } finally {
        setLoading(false);
      }
    }

    loadIndicators();
  }, []);

  return {
    data,
    loading,
    error,
  };
}
'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SurveyDraftStatus } from '../components/survey-draft-notice';
import type { SurveyDraft, WorkCondition, WorkModality } from '../types/survey.types';

const KEY_PREFIX = 'umsspira:survey-draft:';
// Salario y tiempo de inserción: solo en la sesión de la pestaña (confidencialidad).
const SESSION_PREFIX = 'umsspira:survey-session:';
const CONDITIONS: WorkCondition[] = ['works', 'not-works'];
const MODALITIES: WorkModality[] = ['presencial', 'remoto', 'hibrido'];

const buildKey = (userId: string) => `${KEY_PREFIX}${userId}`;
const buildSessionKey = (userId: string) => `${SESSION_PREFIX}${userId}`;

function text(value: unknown, max: number): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value.slice(0, max) : undefined;
}

export function sanitizeDraft(raw: unknown): SurveyDraft | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const data = raw as Record<string, unknown>;
  const condition = data.workCondition;
  if (!CONDITIONS.includes(condition as WorkCondition)) return null;

  if (condition === 'not-works') return { workCondition: 'not-works' };

  const modalidad = MODALITIES.includes(data.modalidad as WorkModality)
    ? (data.modalidad as WorkModality)
    : undefined;

  return {
    workCondition: 'works',
    cargo: text(data.cargo, 100),
    empresa: text(data.empresa, 100),
    area: text(data.area, 100),
    modalidad,
  };
}

/** Salario (texto corto) y tiempo de inserción (meses, hasta 3 dígitos) del borrador de la pestaña. */
export function sanitizeSensitive(raw: unknown): Pick<SurveyDraft, 'salario_mensual' | 'tiempo_insercion'> {
  if (typeof raw !== 'object' || raw === null) return {};
  const data = raw as Record<string, unknown>;
  const tiempo = typeof data.tiempo_insercion === 'string' && /^\d{1,3}$/.test(data.tiempo_insercion)
    ? data.tiempo_insercion
    : undefined;
  return { salario_mensual: text(data.salario_mensual, 30), tiempo_insercion: tiempo };
}

function readDraft(userId: string): SurveyDraft | null {
  try {
    const stored = window.localStorage.getItem(buildKey(userId));
    const base = stored ? sanitizeDraft(JSON.parse(stored)) : null;
    if (!base || base.workCondition !== 'works') return base;
    const session = window.sessionStorage.getItem(buildSessionKey(userId));
    return session ? { ...base, ...sanitizeSensitive(JSON.parse(session)) } : base;
  } catch {
    return null;
  }
}

export function clearSurveyDraft(userId: string): void {
  try {
    window.localStorage.removeItem(buildKey(userId));
    window.sessionStorage.removeItem(buildSessionKey(userId));
  } catch {
    /* sin acceso a storage */
  }
}

export function clearAllSurveyDrafts(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(KEY_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => window.localStorage.removeItem(key));
    const sessionKeys: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (key?.startsWith(SESSION_PREFIX)) sessionKeys.push(key);
    }
    sessionKeys.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    /* sin acceso a storage */
  }
}

export function useSurveyDraft(userId: string | undefined) {
  const [draft, setDraft] = useState<SurveyDraft | null>(null);
  const [status, setStatus] = useState<SurveyDraftStatus>('idle');

  useEffect(() => {
    if (!userId) return;
    const stored = readDraft(userId);
    if (stored) {
      setDraft(stored);
      setStatus('recovered');
    }
  }, [userId]);

  const saveDraft = useCallback(
    (values: SurveyDraft) => {
      if (!userId) return;
      const clean = sanitizeDraft(values);
      if (!clean) return;
      try {
        window.localStorage.setItem(buildKey(userId), JSON.stringify(clean));
        const sensitive = clean.workCondition === 'works' ? sanitizeSensitive(values) : {};
        if (sensitive.salario_mensual || sensitive.tiempo_insercion) {
          window.sessionStorage.setItem(buildSessionKey(userId), JSON.stringify(sensitive));
        } else {
          window.sessionStorage.removeItem(buildSessionKey(userId));
        }
        setStatus('saved');
      } catch {
        /* storage lleno o bloqueado */
      }
    },
    [userId],
  );

  const clearDraft = useCallback(() => {
    if (userId) clearSurveyDraft(userId);
    setDraft(null);
    setStatus('idle');
  }, [userId]);

  return { draft, status, saveDraft, clearDraft };
}
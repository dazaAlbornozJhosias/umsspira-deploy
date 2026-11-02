'use client';

export type SurveyDraftStatus = 'idle' | 'saved' | 'recovered';

interface SurveyDraftNoticeProps {
  status: SurveyDraftStatus;
}

const MESSAGES: Record<Exclude<SurveyDraftStatus, 'idle'>, { title: string; text: string }> = {
  saved: {
    title: 'Borrador guardado en este navegador',
    text: 'Tus respuestas quedan guardadas localmente mientras avanzas.',
  },
  recovered: {
    title: 'Borrador recuperado',
    text: 'Al volver a abrir la encuesta se recuperó la condición laboral y el borrador anterior.',
  },
};

export function SurveyDraftNotice({ status }: SurveyDraftNoticeProps) {
  if (status === 'idle') return null;

  const { title, text } = MESSAGES[status];

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm"
    >
      <p className="font-semibold text-green-800">{title}</p>
      <p className="text-green-800/80">{text}</p>
    </div>
  );
}
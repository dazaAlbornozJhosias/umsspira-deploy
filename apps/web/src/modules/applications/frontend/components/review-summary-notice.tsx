import type { BoardDetail, ReviewAuthor, ReviewSummary } from '../services/applications-board.service';

type Props = {
  summary?: ReviewSummary;
  currentReviewer?: ReviewAuthor;
  reviewAuthor?: BoardDetail['reviewAuthor'];
  pending: boolean;
};

export function ReviewSummaryNotice({ summary, currentReviewer, reviewAuthor, pending }: Props) {
  return <section aria-label="Historial y reglas del dictamen" className="mb-6 space-y-3 border-b border-[#C9C1B1] pb-4 text-sm text-[#2C3B4D]">
    {summary ? <>
      <div className="flex flex-wrap gap-3 font-semibold">
        <span className="rounded border border-[#A35139] bg-white px-3 py-1 text-[#A35139]">
          Observaciones: {summary.observations} de {summary.maxObservations}
        </span>
        <span className="rounded bg-[#A35139] px-3 py-1 text-white">
          Rechazos acumulados: {summary.rejections} de {summary.maxRejections}
        </span>
      </div>
      {summary.latestObservation && <p className="break-words rounded border border-[#A35139] bg-white p-3 text-[#A35139]">
        <strong>Observación más reciente: </strong>{summary.latestObservation}
      </p>}
      {pending && !summary.canObserve && <p role="alert" className="font-semibold text-[#A35139]">
        Se alcanzó el máximo de {summary.maxObservations} observaciones. En esta revisión debes aprobar o rechazar; no se permite otra observación.
      </p>}
      {summary.rejections >= summary.maxRejections - 1 && <p className="text-[#A35139]">
        {summary.rejections >= summary.maxRejections
          ? 'Esta identidad alcanzó el límite de rechazos y no puede iniciar una nueva solicitud.'
          : 'Un nuevo rechazo alcanzará el límite de cinco y bloqueará un nuevo registro para esta identidad.'}
      </p>}
    </> : <p role="alert">No se pudieron consultar los contadores. Vuelve a abrir el expediente antes de observar.</p>}
    {pending && currentReviewer && <p>
      <strong>Autor del próximo dictamen: </strong>{currentReviewer.name ? `${currentReviewer.name} · ` : ''}{currentReviewer.email}
      <span className="block text-xs">Se registra automáticamente desde tu sesión al confirmar.</span>
    </p>}
    {reviewAuthor && <p><strong>Último dictamen emitido por: </strong>
      {reviewAuthor.name ? `${reviewAuthor.name} · ` : ''}{reviewAuthor.email}
      {' · '}{new Date(reviewAuthor.reviewedAt).toLocaleString('es-BO', { timeZone: 'America/La_Paz' })}
    </p>}
  </section>;
}

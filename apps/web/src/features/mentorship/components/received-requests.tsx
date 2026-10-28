'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, CalendarDays, Check, CircleAlert, Clock3, Eye, Inbox,
  MessageSquareText, X,
} from 'lucide-react';
import { getMentorProfile } from '../services/mentorship-api';
import { getReceivedRequest, listReceivedRequests, ReceivedRequestsError, respondToReceivedRequest, type ReceivedRequest } from '../services/received-requests-api';

type RequestStatus = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'CANCELADA';
type RequestItem = {
  id: string;
  name: string;
  initials: string;
  career: string;
  date: string;
  weekday: string;
  time: string;
  message: string;
  status: RequestStatus;
  sentAt: string;
  respondedAt: string | null;
  requestedArea: string;
};
type Filter = 'TODAS' | RequestStatus;
type Dialog = { kind: 'confirm' | 'success' | 'processed'; action?: 'accept' | 'reject' | 'cancel'; requestId?: string } | null;
type SentRequest = { id: string; mentor: string; role: string; date: string; time: string; reason: string; status: RequestStatus };

const initialSentRequests: SentRequest[] = [
  { id: 'sent-1', mentor: 'Carlos Vargas', role: 'Arquitecto de Software', date: '19/10', time: '09:00', reason: '—', status: 'PENDIENTE' },
  { id: 'sent-2', mentor: 'Carlos Vargas', role: 'Arquitecto de Software', date: '19/10', time: '09:00', reason: '—', status: 'CANCELADA' },
  { id: 'sent-3', mentor: 'Ing. Carlos Mendoza', role: 'Ingeniero de Software', date: '20/10', time: '15:00', reason: 'Quisiera orientación para elegir la arquitectura de mi proyecto de grado. Estoy entre monolito modular y microservicios.', status: 'PENDIENTE' },
  { id: 'sent-4', mentor: 'Carlos Vargas', role: 'Arquitecto de Software', date: '23/10', time: '15:00', reason: '—', status: 'ACEPTADA' },
  { id: 'sent-5', mentor: 'Ana Quispe Mamani', role: 'Data Scientist', date: '22/10', time: '11:00', reason: '—', status: 'PENDIENTE' },
  { id: 'sent-6', mentor: 'Daniela Choque', role: 'Tech Lead Frontend', date: '15/10', time: '16:00', reason: '¿Qué ruta recomiendas para aprender Machine Learning desde cero?', status: 'RECHAZADA' },
  { id: 'sent-7', mentor: 'Jorge Flores Gutiérrez', role: 'DevOps Engineer', date: '12/10', time: '12:00', reason: 'Consulta sobre pipelines de CI/CD.', status: 'CANCELADA' },
];

const apiStatus: Record<Exclude<Filter, 'TODAS'>, ReceivedRequest['estado']> = {
  PENDIENTE: 'PENDIENTE', ACEPTADA: 'ACEPTADO', RECHAZADA: 'RECHAZADO', CANCELADA: 'CANCELADO',
};

function mapRequest(request: ReceivedRequest): RequestItem {
  const name = request.solicitante.nombre || 'Solicitante';
  return {
    id: request.id,
    name,
    initials: name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase(),
    career: 'Miembro de la comunidad UMSS',
    date: request.fecha,
    weekday: request.fecha,
    time: `${request.hora_inicio} – ${request.hora_fin}`,
    message: request.mensaje || 'Sin mensaje',
    status: request.estado === 'ACEPTADO' ? 'ACEPTADA' : request.estado === 'RECHAZADO' ? 'RECHAZADA' : request.estado === 'CANCELADO' ? 'CANCELADA' : 'PENDIENTE',
    sentAt: request.fecha_creacion || 'No disponible',
    respondedAt: request.fecha_respuesta,
    requestedArea: 'No especificada por el servicio',
  };
}

const tabs: { id: Filter; label: string }[] = [
  { id: 'TODAS', label: 'Todas' }, { id: 'PENDIENTE', label: 'Pendientes' },
  { id: 'ACEPTADA', label: 'Aceptadas' }, { id: 'RECHAZADA', label: 'Rechazadas' },
  { id: 'CANCELADA', label: 'Canceladas' },
];

function statusLabel(status: RequestStatus) {
  return ({ PENDIENTE: 'Pendiente', ACEPTADA: 'Aceptada', RECHAZADA: 'Rechazada', CANCELADA: 'Cancelada' })[status];
}

function StatusPill({ status }: { status: RequestStatus }) {
  return <span className={`received-status received-status-${status.toLowerCase()}`}><span aria-hidden="true" />{statusLabel(status)}</span>;
}

export function ReceivedRequests() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedView = searchParams.get('view');
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [counts, setCounts] = useState<Record<Filter, number>>({ TODAS: 0, PENDIENTE: 0, ACEPTADA: 0, RECHAZADA: 0, CANCELADA: 0 });
  const [sentRequests, setSentRequests] = useState(initialSentRequests);
  const [screen, setScreen] = useState<'received' | 'sent'>(requestedView === 'sent' ? 'sent' : 'received');
  const [filter, setFilter] = useState<Filter>('PENDIENTE');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [responding, setResponding] = useState(false);
  const [isActiveMentor, setIsActiveMentor] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [reload, setReload] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const selectedRequest = requests.find(request => request.id === selectedId) ?? null;
  const visibleRequests = requests;

  useEffect(() => {
    setScreen(requestedView === 'sent' ? 'sent' : 'received');
  }, [requestedView]);

  useEffect(() => {
    if (screen !== 'received') return;
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setLoadError('');
    const load = async () => {
      try {
        const mentor = await getMentorProfile(controller.signal);
        if (cancelled) return;
        if (!mentor.isActive) {
          setIsActiveMentor(false);
          router.replace('/mentorship');
          return;
        }
        setIsActiveMentor(true);
        const statuses: Exclude<Filter, 'TODAS'>[] = ['PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'CANCELADA'];
        const countsPages = await Promise.all(statuses.map(status => listReceivedRequests(apiStatus[status], 1, controller.signal)));
        const selectedPages = filter === 'TODAS'
          ? page === 1 ? countsPages : await Promise.all(statuses.flatMap(status => Array.from({ length: page }, (_, index) => listReceivedRequests(apiStatus[status], index + 1, controller.signal))))
          : [page === 1 ? countsPages[statuses.indexOf(filter)] : await listReceivedRequests(apiStatus[filter], page, controller.signal)];
        if (cancelled) return;
        const total = countsPages.reduce((sum, result) => sum + result.total, 0);
        const combined = selectedPages.flatMap(result => result.items.map(mapRequest)).sort((a, b) => b.sentAt.localeCompare(a.sentAt));
        const items = filter === 'TODAS' ? combined.slice((page - 1) * 20, page * 20) : combined;
        setRequests(items);
        setTotalPages(filter === 'TODAS' ? Math.max(1, Math.ceil(total / 20)) : countsPages[statuses.indexOf(filter)]?.totalPages ?? 1);
        setCounts(current => {
          const next = { ...current };
          statuses.forEach((status, index) => { next[status] = countsPages[index].total; });
          next.TODAS = total;
          return next;
        });
      } catch (error) {
        if (!cancelled && error instanceof Error && /permiso|participación activa|habilitado|mentor activo/i.test(error.message)) {
          setIsActiveMentor(false);
          router.replace('/mentorship');
        } else if (!cancelled) setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar las solicitudes.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; controller.abort(); };
  }, [filter, page, reload, router, screen]);

  if (screen === 'received' && isActiveMentor !== true) {
    if (isActiveMentor === false) return null;
    return <main className="mentorship-shell received-page">
      {loadError ? <div className="received-error" role="alert">{loadError}<button type="button" onClick={() => setReload(value => value + 1)}>Reintentar</button></div> : <p role="status">Verificando acceso de mentor…</p>}
    </main>;
  }

  const processRequest = () => {
    if (!dialog?.requestId || !dialog.action || dialog.action === 'cancel') return;
    const current = requests.find(request => request.id === dialog.requestId);
    if (!current || current.status !== 'PENDIENTE') {
      setDialog({ kind: 'processed', requestId: dialog.requestId });
      return;
    }
    setActionError('');
    setResponding(true);
    void respondToReceivedRequest(current.id, dialog.action).then(updated => {
      const next = mapRequest(updated);
      setRequests(items => items.map(request => request.id === current.id ? next : request));
      setCounts(count => ({
        ...count,
        [current.status]: Math.max(0, count[current.status] - 1),
        [next.status]: count[next.status] + 1,
      }));
      setFilter(next.status);
      setPage(1);
      setDialog({ kind: 'success', action: dialog.action, requestId: current.id });
      setResponding(false);
    }).catch(async error => {
      if (error instanceof ReceivedRequestsError && error.status === 409) {
        try {
          const updated = mapRequest(await getReceivedRequest(current.id));
          setRequests(items => items.map(request => request.id === current.id ? updated : request));
          setCounts(count => ({
            ...count,
            [current.status]: Math.max(0, count[current.status] - 1),
            [updated.status]: count[updated.status] + 1,
          }));
          setFilter(updated.status);
        } catch { /* Se conserva la solicitud y se informa el conflicto. */ }
        setDialog({ kind: 'processed', requestId: current.id });
        setResponding(false);
        return;
      }
      setActionError('No se pudo registrar tu respuesta. Intenta nuevamente.');
      setResponding(false);
    });
  };

  const cancelSentRequest = () => {
    if (!dialog?.requestId) return;
    const current = sentRequests.find(request => request.id === dialog.requestId);
    if (!current || current.status !== 'PENDIENTE') { setDialog({ kind: 'processed', requestId: dialog.requestId }); return; }
    setSentRequests(items => items.map(request => request.id === current.id ? { ...request, status: 'CANCELADA' } : request));
    setDialog({ kind: 'success', action: 'cancel', requestId: current.id });
  };

  const dialogRequest = dialog?.requestId ? requests.find(request => request.id === dialog.requestId) : null;
  const dialogSentRequest = dialog?.requestId ? sentRequests.find(request => request.id === dialog.requestId) : null;

  return <main className="mentorship-shell received-page">
    <nav className="received-breadcrumb" aria-label="Ruta de navegación">
      <Link href="/">Inicio</Link><span>/</span><Link href="/mentorship">Mentorías</Link><span>/</span>
      <Link href="/mentorship/profile">Mi perfil de mentor</Link><span>/</span><span aria-current="page">{screen === 'received' ? 'Solicitudes recibidas' : 'Mis solicitudes'}</span>
      {selectedRequest && <><span>/</span><span aria-current="page">Detalle</span></>}
    </nav>

    {screen === 'sent' ? <section className="sent-requests">
      <header className="received-title-block">
        <h1>Mis solicitudes de mentoría</h1>
        <p>Historial de las sesiones que solicitaste. Solo puedes cancelar las que aún están pendientes.</p>
      </header>
      <div className="sent-table-wrap"><table className="sent-table">
        <thead><tr><th scope="col">Mentor</th><th scope="col">Fecha</th><th scope="col">Horario</th><th scope="col">Motivo</th><th scope="col">Estado</th><th scope="col">Acción</th></tr></thead>
        <tbody>{sentRequests.map(request => <tr key={request.id}>
          <td><div className="sent-mentor"><span className="sent-mentor-avatar">{request.mentor.split(' ').slice(0, 2).map(part => part[0]).join('')}</span><span><strong>{request.mentor}</strong><small>{request.role}</small></span></div></td>
          <td>{request.date}</td><td>{request.time}</td><td className="sent-reason">{request.reason}</td><td><StatusPill status={request.status} /></td>
          <td>{request.status === 'PENDIENTE' ? <button type="button" className="received-button sent-cancel" onClick={() => setDialog({ kind: 'confirm', action: 'cancel', requestId: request.id })}>Cancelar solicitud</button> : <span className="sent-no-action">Sin acciones</span>}</td>
        </tr>)}</tbody>
      </table></div>
    </section> : selectedRequest ? <section className="received-detail">
      <h1>Detalle de solicitud</h1>
      <button type="button" className="received-button received-back" onClick={() => setSelectedId(null)}><ArrowLeft size={16} />Volver a solicitudes</button>
      <article className="received-detail-card">
        <header className="received-detail-heading">
          <div className="received-avatar received-avatar-large">{selectedRequest.initials}</div>
          <div><h2>{selectedRequest.name}</h2><p>{selectedRequest.career}</p></div>
          <StatusPill status={selectedRequest.status} />
        </header>
        <div className="received-detail-content">
          <div className="received-detail-field"><CalendarDays size={17} /><div><span>Fecha solicitada</span><strong>{selectedRequest.weekday}</strong></div></div>
          <div className="received-detail-field"><CalendarDays size={17} /><div><span>Fecha de envío</span><strong>{selectedRequest.sentAt}</strong></div></div>
          <div className="received-detail-field"><Inbox size={17} /><div><span>Área técnica solicitada</span><strong>{selectedRequest.requestedArea}</strong></div></div>
          <div className="received-detail-field"><Clock3 size={17} /><div><span>Horario</span><strong>{selectedRequest.time}</strong></div></div>
          <div className="received-detail-field"><MessageSquareText size={17} /><div><span>Motivo o mensaje</span><strong>{selectedRequest.message}</strong></div></div>
          <p className="received-detail-note">{selectedRequest.status === 'PENDIENTE' ? 'Esta solicitud espera tu respuesta.' : `Fecha de respuesta: ${selectedRequest.respondedAt ?? 'No disponible'}`}</p>
          {selectedRequest.status === 'PENDIENTE' && <div className="received-actions received-detail-actions">
            <button type="button" className="received-button received-reject" onClick={() => setDialog({ kind: 'confirm', action: 'reject', requestId: selectedRequest.id })}><X size={16} />Rechazar</button>
            <button type="button" className="received-button received-accept" onClick={() => setDialog({ kind: 'confirm', action: 'accept', requestId: selectedRequest.id })}><Check size={16} />Aceptar</button>
          </div>}
        </div>
      </article>
    </section> : <>
      <header className="received-title-block">
        <h1>Solicitudes de mentoría recibidas</h1>
        <p>Consulta y gestiona las solicitudes que otros miembros de la comunidad te enviaron.</p>
      </header>
      <div className="received-tabs" role="tablist" aria-label="Filtrar solicitudes por estado">
        {tabs.map(tab => {
          const count = counts[tab.id];
          return <button key={tab.id} type="button" role="tab" aria-selected={filter === tab.id} className={filter === tab.id ? 'is-active' : ''} onClick={() => { setFilter(tab.id); setPage(1); }}>
            {tab.label}<span>{count}</span>
          </button>;
        })}
      </div>

      {loadError && <div className="received-error" role="alert">{loadError}<button type="button" onClick={() => setReload(value => value + 1)}>Reintentar</button></div>}
      {isActiveMentor && <section className="received-list" aria-label={`${tabs.find(tab => tab.id === filter)?.label} solicitudes`}>
        {loading ? <p role="status">Cargando solicitudes…</p> : visibleRequests.length === 0 ? <div className="received-empty">
          <span className="received-empty-icon"><Inbox size={21} /></span>
          <h2>{filter === 'PENDIENTE' ? 'No tienes solicitudes pendientes' : 'No tienes solicitudes de mentoría'}</h2>
          <p>Cuando alguien solicite una sesión contigo, aparecerá aquí.</p>
        </div> : visibleRequests.map(request => <article className="received-card" key={request.id}>
          <div className="received-card-top">
            <div className="received-person">
              <div className="received-avatar">{request.initials}</div>
              <div><h2>{request.name}</h2><p>{request.career}</p></div>
            </div>
            <StatusPill status={request.status} />
          </div>
          <p className="received-datetime">{request.date} · {request.time}</p>
          <p className="received-sent-date">Enviada: {request.sentAt}{request.respondedAt ? ` · Respondida: ${request.respondedAt}` : ''}</p>
          <p className="received-message">{request.message}</p>
          <div className="received-actions">
            {request.status === 'PENDIENTE' && <>
              <button type="button" className="received-button received-reject" onClick={() => setDialog({ kind: 'confirm', action: 'reject', requestId: request.id })}><X size={16} />Rechazar</button>
              <button type="button" className="received-button received-accept" onClick={() => setDialog({ kind: 'confirm', action: 'accept', requestId: request.id })}><Check size={16} />Aceptar</button>
            </>}
            <button type="button" className="received-button received-details" disabled={loadingDetail} onClick={async () => {
              setLoadingDetail(true);
              try {
                const full = mapRequest(await getReceivedRequest(request.id));
                setRequests(items => items.map(item => item.id === full.id ? full : item));
                setSelectedId(full.id);
              } catch { setActionError('No se pudo cargar el detalle de la solicitud. Intenta nuevamente.'); }
              finally { setLoadingDetail(false); }
            }}><Eye size={16} />Ver detalles</button>
          </div>
        </article>)}
        {!loading && totalPages > 1 && <div className="received-pagination"><button type="button" disabled={page <= 1} onClick={() => setPage(value => Math.max(1, value - 1))}>Anterior</button><span>Página {page} de {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => setPage(value => value + 1)}>Siguiente</button></div>}
      </section>}
      {actionError && <div className="received-error" role="alert">{actionError}</div>}
    </>}

    {dialog && <div className="received-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setDialog(null); }}>
      <section className="received-modal" role="dialog" aria-modal="true" aria-labelledby="received-modal-title">
        {dialog.kind === 'confirm' && <>
          <button type="button" className="received-modal-close" aria-label="Cerrar" onClick={() => setDialog(null)}><X size={18} /></button>
          <span className={`received-modal-icon ${dialog.action === 'accept' ? 'is-accept' : 'is-reject'}`}>{dialog.action === 'accept' ? <Check size={20} /> : <CircleAlert size={20} />}</span>
          <h2 id="received-modal-title">{dialog.action === 'accept' ? '¿Aceptar esta solicitud de mentoría?' : dialog.action === 'reject' ? '¿Rechazar esta solicitud?' : '¿Cancelar esta solicitud?'}</h2>
          <p className="received-modal-description">{dialog.action === 'accept' ? 'Confirma que puedes atender la sesión en la fecha y horario solicitados.' : dialog.action === 'reject' ? 'Esta solicitud dejará de estar pendiente y el solicitante será informado.' : 'La solicitud dejará de estar pendiente. No podrás deshacer esta acción.'}</p>
          {(dialogRequest || dialogSentRequest) && <div className="received-modal-summary"><div><span>{dialogRequest ? 'Solicitante' : 'Mentor'}</span><strong>{dialogRequest?.name ?? dialogSentRequest?.mentor}</strong></div><div><span>Fecha</span><strong>{dialogRequest?.date ?? dialogSentRequest?.date}</strong></div><div><span>Horario</span><strong>{dialogRequest?.time ?? dialogSentRequest?.time}</strong></div></div>}
          {actionError && <p className="received-action-error" role="alert">{actionError}</p>}
          <div className="received-modal-actions"><button type="button" className="received-button received-details" onClick={() => setDialog(null)}>{dialog.action === 'cancel' ? 'Volver' : 'Cancelar'}</button><button type="button" className={`received-button ${dialog.action === 'accept' ? 'received-accept' : 'received-reject'}`} disabled={responding} onClick={dialog.action === 'cancel' ? cancelSentRequest : processRequest}>{dialog.action === 'cancel' ? 'Sí, cancelar' : responding ? 'Enviando…' : 'Confirmar'}</button></div>
        </>}
        {dialog.kind === 'success' && <>
          <span className="received-modal-success-icon"><Check size={20} /></span>
          <h2 id="received-modal-title">{dialog.action === 'accept' ? 'Solicitud aceptada' : dialog.action === 'reject' ? 'Solicitud rechazada' : 'Solicitud cancelada correctamente'}</h2>
          <p className="received-modal-description">{dialog.action === 'cancel' ? 'La solicitud se actualizó correctamente.' : 'El solicitante será informado de tu respuesta.'}</p>
          {(dialogRequest || dialogSentRequest) && <div className="received-modal-result"><strong>{dialogRequest?.name ?? dialogSentRequest?.mentor}</strong><StatusPill status={dialog.action === 'accept' ? 'ACEPTADA' : dialog.action === 'reject' ? 'RECHAZADA' : 'CANCELADA'} /></div>}
          <button type="button" className="received-button received-accept received-modal-done" onClick={() => { setDialog(null); setSelectedId(null); }}>Entendido</button>
        </>}
        {dialog.kind === 'processed' && <>
          <span className="received-modal-icon is-warning"><CircleAlert size={20} /></span>
          <h2 id="received-modal-title">Esta solicitud ya no está pendiente</h2>
          <p className="received-modal-description">Su estado actual es {dialogRequest ? statusLabel(dialogRequest.status) : 'procesada'}. Ya no puedes aceptarla ni rechazarla.</p>
          <button type="button" className="received-button received-accept received-modal-done" onClick={() => setDialog(null)}>Actualizar listado</button>
        </>}
      </section>
    </div>}
  </main>;
}

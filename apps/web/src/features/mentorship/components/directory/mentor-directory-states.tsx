import Link from 'next/link';
import { ArrowLeftIcon, CloudOffIcon, RotateCwIcon, SearchIcon, UsersIcon } from 'lucide-react';

export function DirectorySkeletons({ count = 6 }: { count?: number }) {
  return <>{Array.from({ length: count }, (_, index) => <div className="directory-card directory-skeleton" aria-hidden="true" key={index}>
    <div className="directory-card-heading"><span className="directory-skeleton-avatar" /><div><span /><span /></div></div>
    <div className="directory-skeleton-lines"><span /><span /></div>
    <div className="directory-skeleton-tags"><span /><span /></div>
    <span className="directory-skeleton-button" />
  </div>)}</>;
}

export function DirectoryEmpty({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  const Icon = filtered ? SearchIcon : UsersIcon;
  return <div className="directory-state">
    <span className="directory-state-icon"><Icon aria-hidden="true" /></span>
    <h2>{filtered ? 'No encontramos mentores con estos filtros' : 'Todavía no hay mentores disponibles'}</h2>
    <p>{filtered ? 'Prueba otras áreas o limpia los filtros para explorar el directorio.' : 'Actualmente no encontramos mentores que cumplan las condiciones para aparecer en el directorio.'}</p>
    {filtered ? <button type="button" className="mentor-button mentor-button-secondary" onClick={onClear}>Limpiar filtros</button>
      : <Link href="/mentorship" className="mentor-button mentor-button-secondary"><ArrowLeftIcon className="icon" aria-hidden="true" />Volver a Mentorías</Link>}
  </div>;
}

export function DirectoryError({ message, onRetry, loginRequired = false }: { message: string; onRetry: () => void; loginRequired?: boolean }) {
  return <div className="directory-state" role="alert">
    <span className="directory-state-icon"><CloudOffIcon aria-hidden="true" /></span>
    <h2>No pudimos cargar el directorio de mentores</h2>
    <p>{loginRequired ? message : 'Ocurrió un problema al consultar los mentores. Revisa tu conexión e inténtalo nuevamente.'}</p>
    {loginRequired && <Link href="/login" className="mentor-button mentor-button-secondary">Iniciar sesión</Link>}
    <button className="mentor-button mentor-button-primary" type="button" onClick={onRetry}><RotateCwIcon className="icon" aria-hidden="true" />Reintentar</button>
  </div>;
}

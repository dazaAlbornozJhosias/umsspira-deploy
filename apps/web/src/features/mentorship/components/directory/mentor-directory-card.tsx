'use client';

import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { useState } from 'react';
import { mentorInitials, mentorProfileHref, type DirectoryMentor } from '../../model/mentor-directory';

export function MentorDirectoryCard({ mentor }: { mentor: DirectoryMentor }) {
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const visibleInterests = mentor.interests?.slice(0, 3) ?? [];
  const remainingInterests = mentor.interests?.slice(3) ?? [];
  const label = mentor.availability === 'AVAILABLE' ? 'Disponible'
    : mentor.availability === 'PAUSED' ? 'En pausa'
    : mentor.availability === 'UNAVAILABLE' ? 'No disponible' : 'Sin disponibilidad definida';

  return <article className="directory-card" aria-label={`Mentor: ${mentor.name}`}>
    <header className="directory-card-heading">
      <div className="directory-avatar" role="img" aria-label={`Avatar de ${mentor.name}`}>
        {mentor.photoUrl && failedPhoto !== mentor.photoUrl
          // Public photos have arbitrary hosts; preserve a fallback without enabling an unrestricted image proxy.
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={mentor.photoUrl} alt="" width={48} height={48} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedPhoto(mentor.photoUrl)} />
          : <span className="directory-avatar-initials" aria-hidden="true">{mentorInitials(mentor.name)}</span>}
      </div>
      <div><h2 title={mentor.name}>{mentor.name}</h2>{mentor.profession && <p title={mentor.profession}>{mentor.profession}</p>}</div>
    </header>
    <p className="directory-description">{mentor.description || 'Este mentor todavía no ha agregado una presentación.'}</p>
    <div className="directory-card-section"><h3>Áreas técnicas</h3>
      {mentor.areas.length ? <ul className="directory-tags">{mentor.areas.map(area => <li key={area.id}>{area.name}</li>)}</ul>
        : <p className="directory-muted">Sin áreas registradas</p>}
    </div>
    <div className="directory-card-section"><h3>Intereses</h3>
      {visibleInterests.length ? <ul className="directory-tags directory-interest-tags">{visibleInterests.map(interest => <li key={interest.id} title={interest.name}>{interest.name}</li>)}
        {remainingInterests.length > 0 && <li className="directory-interest-overflow" aria-label={`${remainingInterests.length} ${remainingInterests.length === 1 ? 'interés adicional' : 'intereses adicionales'}: ${remainingInterests.map(interest => interest.name).join(', ')}`} title={remainingInterests.map(interest => interest.name).join(', ')}>+{remainingInterests.length}</li>}
      </ul> : <p className="directory-muted">{mentor.interests ? 'Sin intereses registrados' : 'Información de intereses no disponible'}</p>}
    </div>
    <footer className="directory-card-footer">
      <span className={`directory-availability ${mentor.availability === 'AVAILABLE' ? 'is-available' : ''}`}><span aria-hidden="true" />{label}</span>
      <Link className="mentor-button mentor-button-primary" href={mentorProfileHref(mentor.id)} aria-label={`Ver perfil de ${mentor.name}`}>Ver perfil<ArrowRightIcon className="icon" aria-hidden="true" /></Link>
    </footer>
  </article>;
}

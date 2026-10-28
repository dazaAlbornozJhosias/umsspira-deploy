'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { getMentorProfile } from '../services/mentorship-api';

export function ActiveMentorRequestsLink() {
  const [status, setStatus] = useState<'checking' | 'active' | 'inactive' | 'error'>('checking');
  useEffect(() => {
    const controller = new AbortController();
    void getMentorProfile(controller.signal).then(profile => setStatus(profile.isActive ? 'active' : 'inactive')).catch(() => setStatus('error'));
    return () => controller.abort();
  }, []);
  if (status === 'active') return <Link href="/mentorship/requests/received" className="mentor-button mentor-button-secondary mentor-card-button">
    Ver solicitudes recibidas<ArrowRightIcon className="icon" aria-hidden="true" />
  </Link>;
  if (status === 'checking') return <p className="mentor-requests-access-note" role="status">Verificando tu participación como mentor…</p>;
  if (status === 'inactive') return <p className="mentor-requests-access-note">Para ver solicitudes, activa tu participación desde <Link href="/mentorship/profile">mi perfil de mentor</Link>.</p>;
  return <p className="mentor-requests-access-note">No pudimos verificar tu participación. <Link href="/mentorship/profile">Revisa tu perfil de mentor</Link> y vuelve a cargar la página.</p>;
}

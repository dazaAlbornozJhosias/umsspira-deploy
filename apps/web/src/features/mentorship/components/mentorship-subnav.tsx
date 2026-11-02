'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Compass, Inbox, LayoutGrid, Send, UserRoundCog } from 'lucide-react';

const items = [
  { href: '/mentorship', label: 'Inicio', icon: LayoutGrid },
  { href: '/mentorship/directory', label: 'Explorar mentores', icon: Compass },
  { href: '/mentorship/requests/received?view=sent', label: 'Mis solicitudes', icon: Send },
  { href: '/mentorship/profile', label: 'Mi perfil de mentor', icon: UserRoundCog },
  { href: '/mentorship/requests/received', label: 'Solicitudes recibidas', icon: Inbox },
];

export function MentorshipSubnav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const showingSent = searchParams.get('view') === 'sent';

  return <div className="mentorship-subnav-wrap"><nav className="received-subnav" aria-label="Navegación de mentorías">
    {items.map(item => {
      const hrefPath = item.href.split('?')[0];
      const isCurrent = item.label === 'Mis solicitudes'
        ? pathname === hrefPath && showingSent
        : item.label === 'Solicitudes recibidas'
          ? pathname === hrefPath && !showingSent
          : item.label === 'Mi perfil de mentor'
            ? pathname.startsWith('/mentorship/profile')
          : item.label === 'Inicio'
            ? pathname === '/mentorship'
            : item.label === 'Explorar mentores'
              ? pathname === '/mentorship/directory' || pathname.startsWith('/mentorship/mentors/')
              : false;

      const Icon = item.icon;
      return <Link key={item.label} href={item.href} aria-current={isCurrent ? 'page' : undefined}>
        <Icon aria-hidden="true" /><span>{item.label}</span>
      </Link>;
    })}
  </nav></div>;
}

'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/shared/components/navbar';

export function EventParticipantsHeader({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname() ?? '';
  const isParticipantsPage = /^\/events\/[^/]+\/participants\/?$/.test(pathname);

  return isParticipantsPage ? <Navbar eventManagement /> : <>{children}</>;
}

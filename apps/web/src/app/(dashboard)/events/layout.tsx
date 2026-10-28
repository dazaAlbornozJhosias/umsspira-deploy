
import type { ReactNode } from 'react';
import { EventsHeader } from '@/shared/components/events-ui';
import { AuthenticatedUserSessionProvider } from '@/modules/auth/frontend/components/authenticated-user-context';
import './events.css';

export default function EventsLayout({ children }: { children: ReactNode }) {
  return (
    <AuthenticatedUserSessionProvider>
      <EventsHeader>{children}</EventsHeader>
    </AuthenticatedUserSessionProvider>
  );
}


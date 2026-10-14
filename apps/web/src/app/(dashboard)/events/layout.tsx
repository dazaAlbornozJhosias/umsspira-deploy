import type { ReactNode } from 'react';
import { EventsHeader } from '@/shared/components/events-ui';
import './events.css';

export default function EventsLayout({ children }: { children: ReactNode }) {
  return <EventsHeader>{children}</EventsHeader>;
}

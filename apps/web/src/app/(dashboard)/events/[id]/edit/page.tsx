'use client';

import { useParams } from 'next/navigation';
import { EventPublishedEditor } from '@/shared/components/event-published-editor';

export default function EditPublishedEventPage() {
  const params = useParams<{ id: string }>();
  return <EventPublishedEditor eventId={params.id} />;
}

'use client';

import { useParams } from 'next/navigation';

import { EventDraftEditor } from '@/shared/components/event-draft-editor';

export default function EditEventDraftPage() {
  const params = useParams<{ id: string }>();
  return <EventDraftEditor eventId={params.id} />;
}

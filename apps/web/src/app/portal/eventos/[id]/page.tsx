import EventDetailPage from '@/features/events/event-detail-page';
import '@/app/(dashboard)/events/events.css';

interface PortalEventDetailPageProps {
  params: { id: string };
}

export default function PortalEventDetailPage({ params }: PortalEventDetailPageProps) {
  return <EventDetailPage params={params} catalogHref="/portal/eventos" />;
}

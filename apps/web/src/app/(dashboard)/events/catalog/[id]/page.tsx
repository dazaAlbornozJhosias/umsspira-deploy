import EventDetailPage from '@/features/events/event-detail-page';

interface PublicEventDetailRouteProps {
  params: { id: string };
}

export default function PublicEventDetailRoute({ params }: PublicEventDetailRouteProps) {
  return <EventDetailPage params={params} />;
}

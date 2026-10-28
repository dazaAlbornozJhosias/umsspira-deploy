import EventsCatalogPage from '@/features/events/events-catalog-page';
import '@/app/(dashboard)/events/events.css';

export default function EventosPage() {
  return <EventsCatalogPage detailBasePath="/portal/eventos" />;
}
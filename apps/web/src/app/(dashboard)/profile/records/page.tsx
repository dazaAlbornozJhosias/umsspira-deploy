import { ProfileRecordsManager } from '@/modules/profile/components/profile-records-manager';
import { toRecordSection } from '@/modules/profile/data/profile-records-data';

export default function ProfileRecordsPage({ searchParams }: { searchParams: { seccion?: string } }) {
  return <ProfileRecordsManager initialSection={toRecordSection(searchParams.seccion)} />;
}

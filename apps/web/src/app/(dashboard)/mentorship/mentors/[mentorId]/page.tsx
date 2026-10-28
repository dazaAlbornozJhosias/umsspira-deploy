import type { Metadata } from 'next';
import { MentorDetailPage } from '@/features/mentorship/components/detail/mentor-detail-page';
import '@/features/mentorship/mentor-directory.css';
import '@/features/mentorship/mentor-detail.css';

export const metadata: Metadata = {
  title: 'Perfil del mentor | UMSSPIRA',
};

export default function Page({
  params,
}: {
  params: { mentorId: string };
}) {
  return <MentorDetailPage mentorId={params.mentorId} />;
}

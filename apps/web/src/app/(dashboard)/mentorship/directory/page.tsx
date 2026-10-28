import type { Metadata } from 'next';
import { MentorDirectoryPage } from '@/features/mentorship/components/directory/mentor-directory-page';
import '@/features/mentorship/mentor-directory.css';

export const metadata: Metadata = {
  title: 'Directorio de mentores | UMSSPIRA',
};

export default function Page() {
  return <MentorDirectoryPage />;
}
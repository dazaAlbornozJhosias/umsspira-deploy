import type { ReactNode } from 'react';
import './mentorship.css';
import '@/features/mentorship/mentor-profile.css';
import '@/features/mentorship/received-requests.css';
import { MentorshipSubnav } from '@/features/mentorship/components/mentorship-subnav';
import '@/features/mentorship/mentor-request.css';

export default function MentoriasLayout({ children }: { children: ReactNode }) {
  return <><div className="mentorship-shell mentorship-subnav-shell"><MentorshipSubnav /></div>{children}</>;
}

import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';

export function MentorAreasEditor() {
  return (
    <div className="active-panel-option-action">
      <Link href="/mentorship/profile/areas" className="mentor-button mentor-button-secondary">
        Configurar áreas
        <ArrowRightIcon className="icon" aria-hidden="true" />
      </Link>
    </div>
  );
}

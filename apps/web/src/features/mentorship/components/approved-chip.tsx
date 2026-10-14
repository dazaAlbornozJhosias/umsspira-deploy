import { BadgeCheckIcon, ClockIcon } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export function ApprovedChip({ approved = true, className }: { approved?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'approved-chip',
        approved ? 'approved-chip-approved' : 'approved-chip-pending',
        className,
      )}
    >
      {approved ? <BadgeCheckIcon className="icon icon-success" aria-hidden="true" /> : <ClockIcon className="icon" aria-hidden="true" />}
      {approved ? 'Titulado aprobado' : 'Titulado pendiente'}
    </span>
  );
}

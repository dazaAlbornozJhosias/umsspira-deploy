import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

const styles = {
  active: { wrapper: 'status-badge-active', dot: 'status-dot-active' },
  inactive: { wrapper: 'status-badge-inactive', dot: 'status-dot-inactive' },
};

export function StatusBadge({ variant, children, className }: { variant: keyof typeof styles; children: ReactNode; className?: string }) {
  const s = styles[variant];
  return (
    <span className={cn('status-badge', s.wrapper, className)}>
      <span className={`status-dot ${s.dot}`} aria-hidden="true" />
      {children}
    </span>
  );
}

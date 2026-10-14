import { CheckIcon, CircleAlertIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface SuccessBannerProps {
  title: string;
  tone?: 'success' | 'error';
  children?: ReactNode;
}

export function SuccessBanner({ title, tone = 'success', children }: SuccessBannerProps) {
  const isError = tone === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={isError ? "success-banner success-banner-error" : "success-banner"}
    >
      <span
        aria-hidden="true"
        className="banner-icon"
      >
        {isError ? <CircleAlertIcon className="icon-alert" /> : <CheckIcon className="icon" strokeWidth={3} />}
      </span>
      <div className="banner-content">
        <p className="banner-title">{title}</p>
        {children && <div className="banner-description">{children}</div>}
      </div>
    </div>
  );
}

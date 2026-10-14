import type { ButtonHTMLAttributes, ComponentType } from 'react';
import { LoaderCircleIcon } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

type Icon = ComponentType<{ className?: string }>;
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  iconRight?: Icon;
}

const base = 'mentor-button';

export function PrimaryButton({
  iconRight: IconRight,
  loading,
  loadingLabel,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: Props & { loading?: boolean; loadingLabel?: string }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, 'mentor-button-primary', loading && 'mentor-button-loading', className)}
      {...rest}
    >
      {loading && <LoaderCircleIcon className="icon mentor-button-spinner" aria-hidden="true" />}
      {loading && loadingLabel ? loadingLabel : children}
      {!loading && IconRight && <IconRight className="icon" aria-hidden="true" />}
    </button>
  );
}

export function SecondaryButton({ iconRight: IconRight, className, children, type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      className={cn(
        base,
        'mentor-button-secondary',
        className,
      )}
      {...rest}
    >
      {children}
      {IconRight && <IconRight className="icon" aria-hidden="true" />}
    </button>
  );
}

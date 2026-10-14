import { cn } from '@/shared/utils/cn'
import { HTMLAttributes, forwardRef } from 'react'

const VARIANTS = {
  navy: 'bg-umss-navy text-white',
  orange: 'bg-umss-orange text-white',
  cream: 'bg-umss-cream text-umss-navy',
  outline: 'border border-umss-navy/20 text-umss-navy bg-transparent',
  success: 'bg-emerald-500 text-white',
  danger: 'bg-red-500 text-white',
} as const

export type BadgeVariant = keyof typeof VARIANTS

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'navy', ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1',
        'text-xs font-semibold leading-none',
        'transition-colors duration-150',
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  )
)

Badge.displayName = 'Badge'

export default Badge
export { Badge }

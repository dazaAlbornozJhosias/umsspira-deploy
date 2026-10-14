import { cn } from '@/shared/utils/cn'

interface LogoProps {
  size?: number
  variant?: 'full' | 'icon'
  className?: string
}

export default function Logo({ size = 40, variant = 'full', className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M32 8 L58 20 L32 32 L6 20 Z" fill="#1E3A5F" />
        <path d="M14 24 V38 C14 42 22 46 32 46 C42 46 50 42 50 38 V24 L32 32 Z" fill="#E85D3A" />
        <circle cx="32" cy="42" r="4" fill="#1E3A5F" />
      </svg>

      {variant === 'full' && (
        <div className="flex flex-col leading-none">
          <span className="text-xl font-extrabold tracking-tight text-umss-navy">
            UMSS<span className="text-umss-orange">PIRA</span>
          </span>
          <span className="text-[10px] font-medium text-umss-navy/70">
            Egresados que inspiran
          </span>
        </div>
      )}
    </div>
  )
}
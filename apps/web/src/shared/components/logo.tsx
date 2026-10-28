import Image from 'next/image'
import { cn } from '@/shared/utils/cn'

interface LogoProps {
  size?: number
  variant?: 'full' | 'icon'
  onDark?: boolean
  className?: string
}

export default function Logo({
  size = 40,
  variant = 'full',
  onDark = false,
  className,
}: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Image
        src="/icons/icon-192.png"
        alt=""
        width={size}
        height={size}
        aria-hidden="true"
      />

      {variant === 'full' && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              'text-xl font-extrabold tracking-tight',
              onDark ? 'text-palladian' : 'text-abyssal',
            )}
          >
            UMSS<span className="text-burning-flame">PIRA</span>
          </span>
          <span
            className={cn(
              'text-[10px] font-medium',
              onDark ? 'text-palladian/70' : 'text-abyssal/70',
            )}
          >
            Egresados que inspiran
          </span>
        </div>
      )}
    </div>
  )
}

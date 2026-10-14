import { cn } from '@/shared/utils/cn'
import { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description?: string
  className?: string
}

export default function FeatureCard({ icon: Icon, title, description, className }: FeatureCardProps) {
  return (
    <article
      className={cn(
        'group rounded-2xl border border-umss-navy/10 bg-white p-5 shadow-umss transition-all',
        'hover:-translate-y-0.5 hover:shadow-umss-lg',
        className
      )}
    >
      <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-umss-cream text-umss-navy">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-umss-navy">{title}</h3>
      {description && <p className="mt-1 text-sm text-umss-navy/70">{description}</p>}
    </article>
  )
}
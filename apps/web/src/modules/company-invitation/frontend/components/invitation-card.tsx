import type { ReactNode } from 'react';
import Logo from '@/shared/components/logo';

export function InvitationCard({ children }: { children: ReactNode }) {
  return (
    <section className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-umss">
      <header className="flex h-14 items-center bg-abyssal-blue px-5">
        <Logo size={28} onDark />
      </header>
      <div className="px-6 py-8 sm:px-8">{children}</div>
    </section>
  );
}
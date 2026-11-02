import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export function AccountActivated() {
  return (
    <div className="flex flex-col items-center text-center" role="status">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <CheckCircle2 className="h-9 w-9 text-green-600" aria-hidden="true" />
      </div>
      <h1 className="text-[22px] font-bold leading-[30px] text-abyssal-blue sm:text-[32px] sm:leading-10">
        ¡Cuenta activada!
      </h1>
      <p className="mt-2 text-sm text-blue-fantastic">
        Tu cuenta de empresa ha sido activada correctamente.
      </p>
      <Link
        href="/login"
        className="mt-8 flex h-11 w-full items-center justify-center rounded-lg bg-burning-flame text-sm font-bold text-white hover:bg-burning-flame/90"
      >
        Iniciar sesión
      </Link>
    </div>
  );
}
import { Loader2, MailCheck } from 'lucide-react';

export function ValidatingInvitation() {
  return (
    <div className="flex flex-col items-center text-center" role="status" aria-live="polite">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-burning-flame/20">
        <MailCheck className="h-8 w-8 text-truffle-trouble" aria-hidden="true" />
      </div>
      <h1 className="text-[22px] font-bold leading-[30px] text-abyssal-blue sm:text-[32px] sm:leading-10">
        Validando invitación
      </h1>
      <p className="mt-2 text-sm text-blue-fantastic">
        Estamos verificando tu enlace de invitación para la activación de la cuenta.
      </p>
      <Loader2 className="mt-8 h-10 w-10 animate-spin text-burning-flame" aria-label="Verificando" />
    </div>
  );
}
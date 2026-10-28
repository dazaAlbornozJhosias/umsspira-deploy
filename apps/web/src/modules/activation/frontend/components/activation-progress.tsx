import { Check } from 'lucide-react';

export function ActivationProgress({ step }: { step: 'otp' | 'password' | 'done' }) {
  return <nav aria-label="Pasos de activación" className="mb-8 grid w-full grid-cols-2 gap-4 border-b border-oatmeal pb-6 sm:gap-10">
    {['Verificar código', 'Crear contraseña'].map((label, index) => {
      const complete = step === 'done' || (step === 'password' && index === 0);
      const active = step === 'otp' ? index === 0 : step === 'password' && index === 1;
      return <div key={label} aria-current={active ? 'step' : undefined} className="flex items-center gap-3">
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-xl ${active ? 'border-burning-flame bg-burning-flame text-abyssal-blue' : complete ? 'border-abyssal-blue bg-abyssal-blue text-white' : 'border-oatmeal text-abyssal-blue/60'}`}>
          {complete ? <Check aria-label="Completado" className="h-6 w-6" /> : `0${index + 1}`}
        </span>
        <div><p className="text-sm font-bold text-abyssal-blue sm:text-base">PASO 0{index + 1}: {label}</p>
          <p className="mt-1 text-xs text-abyssal-blue/70">Estado: {complete ? 'Completado' : active ? 'En curso' : 'Pendiente'}</p></div>
      </div>;
    })}
    {step === 'done' && <p className="col-span-2 text-center text-sm font-bold text-abyssal-blue">FLUJO CONCLUIDO • 100%</p>}
  </nav>;
}

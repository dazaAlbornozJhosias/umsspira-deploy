import Link from 'next/link';
import { RegisterCompanyForm } from '@/modules/company-registry/frontend/components/register-company-form';

export default function NewCompanyRegistrationPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <Link href="/company-registry" className="text-sm font-semibold text-abyssal-blue hover:underline">
        ← Volver al registro de empresas
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-abyssal-blue">Registrar empresa</h1>
        <p className="text-sm text-abyssal-blue/70">
          Ingresa los datos acordados en la visita presencial. Cada cuenta recibirá un correo con su enlace de
          activación, válido por 7 días.
        </p>
      </div>
      <RegisterCompanyForm />
    </main>
  );
}
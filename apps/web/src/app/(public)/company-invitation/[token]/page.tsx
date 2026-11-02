'use client';

import { AccountActivated } from '@/modules/company-invitation/frontend/components/account-activated';
import { CreatePasswordForm } from '@/modules/company-invitation/frontend/components/create-password-form';
import { InvitationCard } from '@/modules/company-invitation/frontend/components/invitation-card';
import { InvitationErrorView } from '@/modules/company-invitation/frontend/components/invitation-error-view';
import { ValidatingInvitation } from '@/modules/company-invitation/frontend/components/validating-invitation';
import { useCompanyInvitation } from '@/modules/company-invitation/frontend/hooks/use-company-invitation';

export default function CompanyInvitationPage({ params }: { params: { token: string } }) {
  const { step, failure, retry, activate } = useCompanyInvitation(params.token);

  return (
    <main className="flex min-h-[calc(100vh-144px)] items-center justify-center bg-palladian px-4 py-8 sm:py-12">
      <InvitationCard>
        {step === 'validating' && <ValidatingInvitation />}
        {step === 'form' && <CreatePasswordForm onSubmit={activate} />}
        {step === 'activated' && <AccountActivated />}
        {step === 'error' && failure && <InvitationErrorView reason={failure} onRetry={retry} />}
      </InvitationCard>
    </main>
  );
}
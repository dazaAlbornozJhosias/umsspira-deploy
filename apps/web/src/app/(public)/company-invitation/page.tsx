import { InvitationCard } from '@/modules/company-invitation/frontend/components/invitation-card';
import { InvitationErrorView } from '@/modules/company-invitation/frontend/components/invitation-error-view';

export default function CompanyInvitationWithoutTokenPage() {
  return (
    <main className="flex min-h-[calc(100vh-144px)] items-center justify-center bg-palladian px-4 py-8 sm:py-12">
      <InvitationCard>
        <InvitationErrorView reason="invalid" />
      </InvitationCard>
    </main>
  );
}
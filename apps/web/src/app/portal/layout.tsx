import ServiceWorkerRegister from '../service-worker-register';
import { PortalSiteHeader } from '@/shared/components/portal-site-header';
import { PortalSiteFooter } from '@/shared/components/portal-site-footer';
import './portal.css';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="portal-view flex min-h-screen flex-col">
      <ServiceWorkerRegister />
      <PortalSiteHeader />
      <main className="min-w-0 flex-1">{children}</main>
      <PortalSiteFooter />
    </div>
  );
}

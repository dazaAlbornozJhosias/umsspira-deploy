import { AuthGuard } from '@/shared/components/auth-guard';

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}

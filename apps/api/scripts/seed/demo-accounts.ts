import type { UserRole } from '../../src/shared/security/contexts/actor-context';

export interface DemoAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  profileId: string;
  careerId?: string;
}

export const DEMO_CAREER_ID = '10000000-0000-4000-8000-000000000001';
export const DEMO_GRADUATE_ID = '10000000-0000-4000-8000-000000000002';
export const DEMO_COMPANY_ID = '10000000-0000-4000-8000-000000000003';
export const DEMO_ADMIN_ASSIGNMENT_ID = '10000000-0000-4000-8000-000000000004';

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    email: 'titulado@umss.edu.bo',
    password: 'titulado1234',
    name: 'Titulado de demostración',
    role: 'titulado',
    profileId: DEMO_GRADUATE_ID,
    careerId: DEMO_CAREER_ID,
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    email: 'admin@umss.edu.bo',
    password: 'admin1234',
    name: 'Administrador de demostración',
    role: 'administrador',
    profileId: DEMO_ADMIN_ASSIGNMENT_ID,
    careerId: DEMO_CAREER_ID,
  },
  {
    id: '20000000-0000-4000-8000-000000000003',
    email: 'empresa@umss.edu.bo',
    password: 'empresa1234',
    name: 'Empresa de demostración',
    role: 'empresa',
    profileId: DEMO_COMPANY_ID,
  },
];

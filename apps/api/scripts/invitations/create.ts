import type { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import type { Environment } from '../../src/config/environment';
import {
  generateInvitationToken,
  INVITATION_VALIDITY_DAYS,
} from '../../src/modules/companies/application/security/invitation-token';
import { buildCompanyInvitationEmail } from '../../src/modules/companies/infrastructure/notifications/company-invitation-email';
import { NodeRegistrationSecurity } from '../../src/modules/registrations/infrastructure/security/registration-security';
import { createDatabaseClient } from '../database-client';

// Solo desarrollo: crea una empresa nueva sin dueño y una invitación de administrador.
// Uso: pnpm --filter api invitation:create <correo> ["Nombre de la empresa"]
const ADMIN_EMAIL = 'admin@umss.edu.bo';
const DAY_MS = 24 * 60 * 60 * 1000;

const inputSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  companyName: z.string().trim().min(1).max(100),
});

async function createInvitation(): Promise<void> {
  const input = inputSchema.parse({
    email: process.argv[2],
    companyName: process.argv[3] ?? 'Empresa de prueba ' + new Date().toISOString().slice(0, 16),
  });
  const prisma = createDatabaseClient();
  try {
    if (process.env.APP_ENV === 'production') {
      throw new Error('Este script no se usa en producción');
    }
    const secret = process.env.AUTH_JWT_SECRET;
    if (!secret) {
      throw new Error('Falta AUTH_JWT_SECRET en apps/api/.env');
    }
    const admin = await prisma.usuario.findUnique({
      where: { correo: ADMIN_EMAIL },
      select: { usuario_id: true },
    });
    if (!admin) {
      throw new Error('No existe ' + ADMIN_EMAIL + '; ejecuta primero db:seed:demo');
    }
    const existingUser = await prisma.usuario.findUnique({
      where: { correo: input.email },
      select: { usuario_id: true },
    });
    if (existingUser) {
      throw new Error('Ese correo ya tiene una cuenta; usa otro correo de prueba');
    }

    // Misma clave que la API, para que el envío de correos pueda abrir el contenido cifrado.
    const security = new NodeRegistrationSecurity({
      get: () => secret,
    } as unknown as ConfigService<Environment, true>);
    const { token, tokenHash } = generateInvitationToken();
    const now = new Date();
    const webUrl = (process.env.CORS_ORIGINS ?? 'http://localhost:3001').split(',')[0].trim().replace(/\/+$/, '');
    const activationUrl = `${webUrl}/company-invitation/${token}`;
    const mail = buildCompanyInvitationEmail({
      companyName: input.companyName,
      activationUrl,
      logoUrl: `${webUrl}/umsspira-logo.png`,
    });
    await prisma.$transaction(async (tx) => {
      const company = await tx.empresa.create({
        data: { razon_social: input.companyName, correo: input.email, fecha_registro: now },
        select: { id: true },
      });
      await tx.empresaInvitacion.create({
        data: {
          id_empresa: company.id,
          correo: input.email,
          rol: 'administrador',
          token_hash: tokenHash,
          creado_por: admin.usuario_id,
          creado_en: now,
          expira_en: new Date(now.getTime() + INVITATION_VALIDITY_DAYS * DAY_MS),
        },
      });
      await tx.correoPendiente.create({
        data: {
          contenido: security.seal({ to: input.email, subject: mail.subject, text: mail.text, html: mail.html }),
          expira_en: new Date(now.getTime() + DAY_MS),
        },
      });
    });

    console.info('Invitación creada para ' + input.email + ' (' + input.companyName + ')');
    console.info('Enlace de activación: ' + activationUrl);
  } finally {
    await prisma.$disconnect();
  }
}

void createInvitation().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'No se pudo crear la invitación');
  process.exitCode = 1;
});
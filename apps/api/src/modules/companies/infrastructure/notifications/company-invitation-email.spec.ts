import { buildCompanyInvitationEmail } from './company-invitation-email';

describe('buildCompanyInvitationEmail', () => {
  const email = buildCompanyInvitationEmail({
    companyName: 'TechSolutions S.A.',
    activationUrl: 'http://localhost:3001/company-invitation/abc123',
  });

  it('incluye el botón de activación con el enlace y el token', () => {
    expect(email.html).toContain('Activar mi cuenta');
    expect(email.html).toContain('href="http://localhost:3001/company-invitation/abc123"');
  });

  it('informa la vigencia de 7 días', () => {
    expect(email.html).toContain('Este enlace es válido por 7 días.');
    expect(email.text).toContain('Este enlace es válido por 7 días.');
  });

  it('muestra el nombre de la empresa y el asunto', () => {
    expect(email.subject).toBe('¡Estás invitado a unirte a UMSSPIRA!');
    expect(email.html).toContain('TechSolutions S.A.');
  });

  it('escapa el HTML del nombre de la empresa', () => {
    const unsafe = buildCompanyInvitationEmail({
      companyName: '<script>alert(1)</script>',
      activationUrl: 'http://localhost:3001/company-invitation/x',
    });
    expect(unsafe.html).not.toContain('<script>');
    expect(unsafe.html).toContain('&lt;script&gt;');
  });
  it('muestra el logo cuando recibe su URL', () => {
    const withLogo = buildCompanyInvitationEmail({
      companyName: 'TechSolutions S.A.',
      activationUrl: 'http://localhost:3001/company-invitation/abc123',
      logoUrl: 'http://localhost:3001/umsspira-logo.png',
    });
    expect(withLogo.html).toContain('<img src="http://localhost:3001/umsspira-logo.png"');
    expect(email.html).not.toContain('<img');
  });
});
import { escapeHtml, renderApprovalHtml } from './html-mail';

const base = {
  name: 'María Pérez',
  code: '123456',
  activationLink: 'https://umsspira.test/activate?applicationId=abc',
  applicationId: 'abc',
  origin: 'https://umsspira.test',
};

describe('Correo de aprobación en HTML', () => {
  it('escapa los caracteres especiales', () => {
    expect(escapeHtml('<b>"A" & \'B\'</b>')).toBe('&lt;b&gt;&quot;A&quot; &amp; &#39;B&#39;&lt;/b&gt;');
  });

  it('incluye el código, el botón con el enlace, la vigencia y el logo', () => {
    const html = renderApprovalHtml(base);
    const cells = html.match(/font-size:38px[^>]*>(\d)<\/td>/g) ?? [];
    expect(cells.map((cell) => cell.slice(-6, -5)).join('')).toBe('123456');
    expect(html).toContain('href="https://umsspira.test/activate?applicationId=abc"');
    expect(html).toContain('Activar mi cuenta');
    expect(html).toContain('24 horas');
    expect(html).toContain('src="https://umsspira.test/assets/events/umsspira-logo-desktop.png"');
    expect(html).not.toContain('TIT-');
  });

  it('carga los íconos desde la web', () => {
    const html = renderApprovalHtml(base);
    expect(html).toContain('src="https://umsspira.test/email/check-badge.png"');
    expect(html).toContain('src="https://umsspira.test/email/clock.png"');
    expect(html).toContain('src="https://umsspira.test/email/shield.png"');
  });

  it('explica cómo activar la cuenta y cómo pedir otro código', () => {
    const html = renderApprovalHtml(base);
    expect(html).toContain('Cómo activar tu cuenta');
    expect(html).toContain('Reenviar código');
    expect(html).toContain('5 intentos incorrectos');
    expect(html).toContain('Aviso de seguridad institucional');
  });

  it('no deja pasar HTML escrito en el nombre', () => {
    const html = renderApprovalHtml({ ...base, name: 'Ana <script>alert(1)</script>' });
    expect(html).not.toContain('<script>');
    expect(html).toContain('Ana &lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('omite el nombre cuando viene vacío', () => {
    expect(renderApprovalHtml({ ...base, name: '  ' })).toContain('Hola,');
  });
});
import { buildObservedMail, OBSERVED_MAIL_SUBJECT } from './observed-mail';

const base = {
  fullName: 'Ana Perez',
  category: 'Documento ilegible',
  note: 'El sello del Decano es ilegible.\nVuelva a escanear a 300 DPI.',
  correctionUrl: 'https://web.test/applications/correct/tok_123',
  origin: 'https://web.test/',
};

describe('buildObservedMail', () => {
  it('usa el asunto institucional y el tipo observacion', () => {
    const mail = buildObservedMail(base);
    expect(mail.type).toBe('observacion');
    expect(mail.subject).toBe(OBSERVED_MAIL_SUBJECT);
  });

  it('incluye categoria, justificacion y enlace en el texto plano', () => {
    const { text } = buildObservedMail(base);
    expect(text).toContain('Categoría de observación: Documento ilegible');
    expect(text).toContain('Justificación del auditor: El sello del Decano es ilegible.');
    expect(text).toContain(base.correctionUrl);
    expect(text).toContain('Tus datos anteriores y el historial de tu trámite se conservarán intactos');
  });

  it('incluye boton, detalle y enlace en el html', () => {
    const { html } = buildObservedMail(base);
    expect(html).toContain('Tu solicitud necesita correcciones');
    expect(html).toContain('Detalle de la observación documental');
    expect(html).toContain('Documento ilegible');
    expect(html).toContain(`href="${base.correctionUrl}"`);
    expect(html).toContain('Corregir mi solicitud');
    expect(html).toContain('https://web.test/assets/events/umsspira-logo-desktop.png');
    expect(html).toContain('https://web.test/email/edit-badge.png');
  });

  it('escapa el contenido escrito por el auditor', () => {
    const { html } = buildObservedMail({ ...base, note: '<script>alert(1)</script>' });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('respeta saltos de linea de la justificacion', () => {
    expect(buildObservedMail(base).html).toContain('ilegible.<br>Vuelva');
  });

  it('funciona sin nombre', () => {
    const mail = buildObservedMail({ ...base, fullName: null });
    expect(mail.text.startsWith('Hola,')).toBe(true);
  });
});
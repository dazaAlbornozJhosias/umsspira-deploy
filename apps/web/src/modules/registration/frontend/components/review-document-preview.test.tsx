import { render, screen, waitFor } from '@testing-library/react';
import { ReviewDocumentPreview } from './review-document-preview';
import { useRegistrationStore } from '../store';

const document = { path: 'file-id', originalName: 'titulo.png', mimeType: 'image/png', sizeBytes: 4,
  tipoDocumento: 'diploma_academico' as const, previewUrl: null, previewKind: 'image' as const };

describe('Vista previa recuperada del borrador', () => {
  beforeEach(() => {
    useRegistrationStore.getState().setSessionToken('session-token');
    global.fetch = jest.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(['data'], { type: 'image/png' }) });
    URL.createObjectURL = jest.fn().mockReturnValue('blob:recovered');
    URL.revokeObjectURL = jest.fn();
  });

  it('recupera el archivo sin depender del blob del paso anterior y libera su propia URL', async () => {
    const view = render(<ReviewDocumentPreview document={document} />);
    expect(await screen.findByAltText('Vista previa de titulo.png')).toHaveAttribute('src', 'blob:recovered');
    expect(fetch).toHaveBeenCalledWith('/api/v1/registrations/sessions/session-token/document', expect.objectContaining({ cache: 'no-store' }));
    view.unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:recovered');
  });

  it('muestra el error del servidor sin afirmar que el navegador no soporta el archivo', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({ error: { message: 'El registro venció', code: 'REGISTRATION_EXPIRED' } }) });
    render(<ReviewDocumentPreview document={document} />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('El registro venció'));
  });
});

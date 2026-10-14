import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MentorProfileInfoPage } from './mentor-profile-info-page';
import {
  getMentorProfileInformation,
  updateMentorProfileInformation,
  deleteMentorProfileInformation,
} from '../services/mentor-profile-info-api';

jest.mock('../services/mentor-profile-info-api');
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

const mockGet = jest.mocked(getMentorProfileInformation);
const mockUpdate = jest.mocked(updateMentorProfileInformation);
const mockDelete = jest.mocked(deleteMentorProfileInformation);

const sampleProfile = {
  descripcion: 'Ingeniero de software con 8 años de experiencia',
  experiencia: 'Liderazgo técnico en microservicios, TypeScript y Postgres',
  informacion_relevante: 'Disponible para sesiones de orientación quincenales',
  foto_perfil: null,
  anios_exp: 8,
  fecha_actualizacion: '2026-10-07',
};

beforeEach(() => {
  jest.resetAllMocks();
});

describe('MentorProfileInfoPage (HU-6.5)', () => {
  it('muestra el estado vacío cuando el mentor no tiene información registrada', async () => {
    mockGet.mockResolvedValue({ exists: false, profile: null });
    render(<MentorProfileInfoPage />);

    expect(await screen.findByText('Aún no has agregado información a tu perfil de mentor')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ Agregar información/i })).toBeEnabled();
    expect(
      screen.getByText('Tu perfil no muestra información a los estudiantes hasta que la agregues.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Volver a mi perfil/i })).toHaveAttribute('href', '/mentorship/profile');
  });

  it('muestra la información guardada en modo lectura cuando existen datos previos', async () => {
    mockGet.mockResolvedValue({ exists: true, profile: sampleProfile });
    render(<MentorProfileInfoPage />);

    expect(await screen.findByText(sampleProfile.descripcion)).toBeInTheDocument();
    expect(screen.getByText(sampleProfile.experiencia)).toBeInTheDocument();
    expect(screen.getByText(sampleProfile.informacion_relevante)).toBeInTheDocument();
    expect(screen.getByText('Mentor activo')).toBeInTheDocument();
    expect(screen.getByText(sampleProfile.fecha_actualizacion)).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Editar información/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Eliminar información/i })).toBeInTheDocument();
  });

  it('abre el formulario de edición y marca los campos obligatorios con asterisco', async () => {
    mockGet.mockResolvedValue({ exists: false, profile: null });
    render(<MentorProfileInfoPage />);

    const addBtn = await screen.findByRole('button', { name: /\+ Agregar información/i });
    fireEvent.click(addBtn);

    expect(screen.getByLabelText(/Descripción profesional/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Experiencia profesional/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Información relevante para la mentoría/i)).toBeInTheDocument();

    expect(screen.getByText(/Los campos marcados con/i)).toBeInTheDocument();
  });

  it('muestra mensaje de error si se intenta guardar con campos obligatorios vacíos', async () => {
    mockGet.mockResolvedValue({ exists: false, profile: null });
    render(<MentorProfileInfoPage />);

    fireEvent.click(await screen.findByRole('button', { name: /\+ Agregar información/i }));

    const saveBtn = screen.getByRole('button', { name: /Guardar información/i });
    fireEvent.click(saveBtn);

    expect(await screen.findByText('La descripción profesional es obligatoria.')).toBeInTheDocument();
    expect(screen.getByText('La experiencia profesional es obligatoria.')).toBeInTheDocument();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('muestra indicador de cambios sin guardar al escribir en el formulario', async () => {
    mockGet.mockResolvedValue({ exists: true, profile: sampleProfile });
    render(<MentorProfileInfoPage />);

    fireEvent.click(await screen.findByRole('button', { name: /Editar información/i }));

    expect(screen.queryByText('Cambios sin guardar')).not.toBeInTheDocument();

    const descInput = screen.getByLabelText(/Descripción profesional/i);
    fireEvent.change(descInput, { target: { value: 'Texto modificado' } });

    expect(screen.getByText('Cambios sin guardar')).toBeInTheDocument();
  });

  it('descarta cambios y regresa a la vista de lectura al pulsar Cancelar', async () => {
    mockGet.mockResolvedValue({ exists: true, profile: sampleProfile });
    render(<MentorProfileInfoPage />);

    fireEvent.click(await screen.findByRole('button', { name: /Editar información/i }));

    const descInput = screen.getByLabelText(/Descripción profesional/i);
    fireEvent.change(descInput, { target: { value: 'Texto cambiado que será cancelado' } });

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(await screen.findByText(sampleProfile.descripcion)).toBeInTheDocument();
    expect(screen.queryByText('Texto cambiado que será cancelado')).not.toBeInTheDocument();
  });

  it('guarda exitosamente los cambios y muestra el banner verde de confirmación', async () => {
    mockGet.mockResolvedValue({ exists: true, profile: sampleProfile });
    const updatedProfile = {
      ...sampleProfile,
      descripcion: 'Descripción actualizada con éxito',
      experiencia: 'Experiencia actualizada con éxito',
    };
    mockUpdate.mockResolvedValue({ exists: true, profile: updatedProfile });

    render(<MentorProfileInfoPage />);

    fireEvent.click(await screen.findByRole('button', { name: /Editar información/i }));

    const descInput = screen.getByLabelText(/Descripción profesional/i);
    const expInput = screen.getByLabelText(/Experiencia profesional/i);

    fireEvent.change(descInput, { target: { value: updatedProfile.descripcion } });
    fireEvent.change(expInput, { target: { value: updatedProfile.experiencia } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar información/i }));

    expect(await screen.findByText('Información actualizada correctamente')).toBeInTheDocument();
    expect(screen.getByText(updatedProfile.descripcion)).toBeInTheDocument();
    expect(screen.getByText(updatedProfile.experiencia)).toBeInTheDocument();
  });

  it('despliega modal de confirmación al eliminar y descarta al cancelar', async () => {
    mockGet.mockResolvedValue({ exists: true, profile: sampleProfile });
    render(<MentorProfileInfoPage />);

    fireEvent.click(await screen.findByRole('button', { name: /Eliminar información/i }));

    const modal = screen.getByRole('alertdialog');
    expect(within(modal).getByText('¿Eliminar información del perfil?')).toBeInTheDocument();

    fireEvent.click(within(modal).getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(mockDelete).not.toHaveBeenCalled();
    expect(screen.getByText(sampleProfile.descripcion)).toBeInTheDocument();
  });

  it('elimina la información al confirmar en el modal y retorna al estado inicial vacío', async () => {
    mockGet.mockResolvedValue({ exists: true, profile: sampleProfile });
    mockDelete.mockResolvedValue({ exists: false, profile: null });

    render(<MentorProfileInfoPage />);

    fireEvent.click(await screen.findByRole('button', { name: /Eliminar información/i }));

    const modal = screen.getByRole('alertdialog');
    fireEvent.click(within(modal).getByRole('button', { name: 'Eliminar' }));

    expect(await screen.findByText('Aún no has agregado información a tu perfil de mentor')).toBeInTheDocument();
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /\+ Agregar información/i })).toBeEnabled();
  });

  it('bloquea el guardado y marca el contador en rojo si se superan los límites de caracteres', async () => {
    mockGet.mockResolvedValue({ exists: false, profile: null });
    render(<MentorProfileInfoPage />);

    fireEvent.click(await screen.findByRole('button', { name: /\+ Agregar información/i }));

    const descInput = screen.getByLabelText(/Descripción profesional/i);
    const longText = 'a'.repeat(501);
    fireEvent.change(descInput, { target: { value: longText } });

    expect(screen.getByText('501 / 500')).toHaveClass('is-limit');
    expect(screen.getByText('La descripción no debe superar los 500 caracteres.')).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: /Guardar información/i });
    expect(saveBtn).toBeDisabled();
  });

  it('valida el tamaño y formato de archivo de la fotografía de perfil', async () => {
    mockGet.mockResolvedValue({ exists: false, profile: null });
    render(<MentorProfileInfoPage />);

    fireEvent.click(await screen.findByRole('button', { name: /\+ Agregar información/i }));

    const fileInput = screen.getByLabelText('Subir fotografía de perfil');

    // Archivo mayor a 5 MB
    const hugeFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'foto_pesada.jpg', {
      type: 'image/jpeg',
    });
    fireEvent.change(fileInput, { target: { files: [hugeFile] } });

    expect(await screen.findByText(/supera los 5 MB permitidos/i)).toBeInTheDocument();

    // Archivo con formato no admitido
    const invalidFile = new File(['dummy'], 'documento.pdf', {
      type: 'application/pdf',
    });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(await screen.findByText(/formato de imagen no es admitido/i)).toBeInTheDocument();
  });
});

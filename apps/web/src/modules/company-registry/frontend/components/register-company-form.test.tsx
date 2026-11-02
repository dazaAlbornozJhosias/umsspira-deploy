import { fireEvent, render, screen } from '@testing-library/react';
import { registerCompany } from '../services/company-registry.service';
import { RegisterCompanyForm } from './register-company-form';

jest.mock('../services/company-registry.service', () => ({ registerCompany: jest.fn() }));

const registerCompanyMock = registerCompany as jest.Mock;

function fillCompany(taxId = '1023456029') {
  fireEvent.change(screen.getByLabelText(/razón social/i), { target: { value: 'TechSolutions S.A.' } });
  fireEvent.change(screen.getByLabelText(/^nit/i), { target: { value: taxId } });
  fireEvent.change(screen.getByLabelText(/correo de la cuenta 1/i), { target: { value: 'gerencia@empresa.com' } });
}

describe('RegisterCompanyForm (US-1.4)', () => {
  beforeEach(() => registerCompanyMock.mockReset());

  it('registra la empresa con dos cuentas y muestra el resumen', async () => {
    registerCompanyMock.mockResolvedValue({
      companyId: 'empresa-1',
      companyName: 'TechSolutions S.A.',
      taxId: '1023456029',
      invitations: [
        { email: 'gerencia@empresa.com', role: 'administrador', expiresAt: '2026-11-05T12:00:00.000Z' },
        { email: 'rrhh@empresa.com', role: 'reclutador', expiresAt: '2026-11-05T12:00:00.000Z' },
      ],
    });
    render(<RegisterCompanyForm />);

    fillCompany();
    fireEvent.click(screen.getByRole('button', { name: /agregar cuenta/i }));
    fireEvent.change(screen.getByLabelText(/correo de la cuenta 2/i), { target: { value: 'rrhh@empresa.com' } });
    fireEvent.click(screen.getByRole('button', { name: /registrar y enviar invitaciones/i }));

    expect(await screen.findByText('Empresa registrada')).toBeInTheDocument();
    expect(registerCompanyMock).toHaveBeenCalledWith({
      companyName: 'TechSolutions S.A.',
      taxId: '1023456029',
      accounts: [
        { email: 'gerencia@empresa.com', role: 'administrador' },
        { email: 'rrhh@empresa.com', role: 'reclutador' },
      ],
    });
  });

  it('no envía el formulario si el NIT no es válido', () => {
    render(<RegisterCompanyForm />);
    fillCompany('12A-45');
    fireEvent.click(screen.getByRole('button', { name: /registrar y enviar invitaciones/i }));

    expect(screen.getByText(/el nit debe tener entre 7 y 15 dígitos/i)).toBeInTheDocument();
    expect(registerCompanyMock).not.toHaveBeenCalled();
  });

  it('muestra el error de la API cuando el NIT ya existe', async () => {
    registerCompanyMock.mockRejectedValue(new Error('Ya existe una empresa registrada con ese NIT'));
    render(<RegisterCompanyForm />);
    fillCompany();
    fireEvent.click(screen.getByRole('button', { name: /registrar y enviar invitaciones/i }));

    expect(await screen.findByText('Ya existe una empresa registrada con ese NIT')).toBeInTheDocument();
  });
});
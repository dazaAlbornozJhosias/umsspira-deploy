import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { supabaseClient } from '../../shared/lib/supabase';
import { CertificacionRespaldoService } from './certificacion-respaldo.service';
import { PerfilRepository } from './perfil.repository';

jest.mock('../../shared/lib/supabase', () => ({ supabaseClient: jest.fn() }));

const upload = jest.fn();
(supabaseClient as jest.Mock).mockReturnValue({ storage: { from: () => ({ upload }) } });

function archivo(mimetype: string, originalname: string): Express.Multer.File {
  return { mimetype, originalname, buffer: Buffer.from('x'), size: 1 } as Express.Multer.File;
}

describe('CertificacionRespaldoService', () => {
  const obtenerPorId = jest.fn();
  const guardarRespaldo = jest.fn();
  const servicio = new CertificacionRespaldoService({
    obtenerPorId,
    guardarRespaldo,
  } as unknown as PerfilRepository);

  beforeEach(() => {
    jest.clearAllMocks();
    obtenerPorId.mockResolvedValue({ id: 'c1', idTitulado: 't1' });
    upload.mockResolvedValue({ error: null });
    guardarRespaldo.mockResolvedValue({ id: 'r1' });
  });

  it('sube un JPG como FOTO y lo registra', async () => {
    await expect(servicio.subir('t1', 'c1', archivo('image/jpeg', 'Titulo.jpg'))).resolves.toEqual({ id: 'r1' });
    expect(upload).toHaveBeenCalled();
    expect(guardarRespaldo).toHaveBeenCalledWith('c1', 'FOTO', expect.stringMatching(/^t1\/c1\/\d+_titulo\.jpg$/));
  });

  it('responde 400 si no llega archivo', async () => {
    await expect(servicio.subir('t1', 'c1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('responde 404 si la certificación no existe', async () => {
    obtenerPorId.mockResolvedValue(null);
    await expect(servicio.subir('t1', 'c1', archivo('image/png', 'a.png'))).rejects.toBeInstanceOf(NotFoundException);
  });

  it('responde 403 si la certificación es de otro titulado', async () => {
    obtenerPorId.mockResolvedValue({ id: 'c1', idTitulado: 'otro' });
    await expect(servicio.subir('t1', 'c1', archivo('image/png', 'a.png'))).rejects.toBeInstanceOf(ForbiddenException);
    expect(upload).not.toHaveBeenCalled();
  });
});
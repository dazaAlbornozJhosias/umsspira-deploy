import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { BusinessRuleError } from '../../../../shared/errors/business-rule-error';
import type { ProfileRepository } from '../ports/profile-repository.port';
import { GetProfessionalDescriptionUseCase } from './get-professional-description.use-case';
import { SaveProfessionalDescriptionUseCase } from './save-professional-description.use-case';

const actor: ActorContext = {
  id: 'usuario-1',
  email: 'titulado@example.com',
  name: 'María Pérez',
  role: 'titulado',
  credentialVersion: 1,
  permissions: ['perfil:self:read', 'perfil:self:write'],
  scopes: { graduateId: 'titulado-1', companyIds: [], careerIds: [] },
};
const saved = { text: 'Desarrolladora backend', updatedAt: new Date('2026-10-24T12:00:00Z') };

function setup() {
  const repository = {
    findDescription: jest.fn().mockResolvedValue(saved),
    saveDescription: jest.fn().mockResolvedValue(saved),
  };
  const asRepository = repository as unknown as ProfileRepository;
  return {
    repository,
    get: new GetProfessionalDescriptionUseCase(asRepository),
    save: new SaveProfessionalDescriptionUseCase(asRepository),
  };
}

describe('Descripción profesional (T6.4)', () => {
  it('lee la descripción del titulado de la sesión', async () => {
    const { repository, get } = setup();

    await expect(get.execute(actor)).resolves.toEqual(saved);
    expect(repository.findDescription).toHaveBeenCalledWith({
      graduateId: 'titulado-1',
      userId: 'usuario-1',
    });
  });

  it('guarda el texto solo en el perfil del titulado de la sesión', async () => {
    const { repository, save } = setup();

    await expect(save.execute(actor, 'Desarrolladora backend')).resolves.toEqual(saved);
    expect(repository.saveDescription).toHaveBeenCalledWith(
      { graduateId: 'titulado-1', userId: 'usuario-1' },
      'Desarrolladora backend',
    );
  });

  it('rechaza cuentas sin perfil de titulado sin tocar el repositorio', async () => {
    const { repository, save } = setup();
    const admin = { ...actor, scopes: { ...actor.scopes, graduateId: null } };

    await expect(save.execute(admin, 'Texto')).rejects.toBeInstanceOf(BusinessRuleError);
    expect(repository.saveDescription).not.toHaveBeenCalled();
  });
});

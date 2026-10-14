const { test, describe, it } = require('node:test');
const assert = require('node:assert/strict');
require('reflect-metadata');
const { MentorshipService } = require('../dist/modules/mentorship/mentorship.service');
const { MentorshipController } = require('../dist/modules/mentorship/mentorship.controller');

describe('Mentorship Profile Information (HU-6.5 API)', () => {
  it('MentorshipService: parsea correctamente perfil sin información', async () => {
    const mockService = new MentorshipService({});
    // Mock findById
    mockService.findById = async () => null;

    const res = await mockService.getMyProfileInformation('user-1');
    assert.deepEqual(res, { exists: false, profile: null });
  });

  it('MentorshipService: parsea correctamente perfil con texto plano legado', async () => {
    const mockService = new MentorshipService({});
    mockService.findById = async () => ({
      id: 'user-1',
      experiencia: 'Desarrollo en Java y React',
      anios_exp: 5,
      fecha_actualizacion: '2026-10-07',
    });

    const res = await mockService.getMyProfileInformation('user-1');
    assert.equal(res.exists, true);
    assert.equal(res.profile.experiencia, 'Desarrollo en Java y React');
    assert.equal(res.profile.descripcion, null);
  });

  it('MentorshipService: guarda y recupera estructura completa de HU-6.5', async () => {
    const mockService = new MentorshipService({});
    let storedChanges = null;
    mockService.findById = async () => ({ id: 'user-1' });
    mockService.update = async (id, changes) => {
      storedChanges = changes;
      return {
        id,
        ...changes,
        anios_exp: changes.anios_exp ?? null,
      };
    };

    const payload = {
      descripcion: 'Ingeniero de Software Senior',
      experiencia: '10 años en arquitectura Cloud',
      informacion_relevante: 'Mentorías los sábados',
      foto_perfil: 'data:image/png;base64,abc',
      anios_exp: 10,
    };

    const res = await mockService.updateMyProfileInformation('user-1', payload);
    assert.equal(res.exists, true);
    assert.equal(res.profile.descripcion, payload.descripcion);
    assert.equal(res.profile.experiencia, payload.experiencia);
    assert.equal(res.profile.informacion_relevante, payload.informacion_relevante);
    assert.equal(res.profile.foto_perfil, payload.foto_perfil);
    assert.equal(res.profile.anios_exp, 10);
    assert.ok(storedChanges);

    // Comprobar borrado
    const delRes = await mockService.deleteMyProfileInformation('user-1');
    assert.deepEqual(delRes, { exists: false, profile: null });
    assert.equal(storedChanges.experiencia, null);
  });

  it('MentorshipController: delega correctamente GET, PATCH y DELETE', async () => {
    let called = [];
    const mockService = {
      getMyProfileInformation: async (id) => {
        called.push(['GET', id]);
        return { exists: false, profile: null };
      },
      updateMyProfileInformation: async (id, dto) => {
        called.push(['PATCH', id, dto]);
        return { exists: true, profile: { experiencia: dto.experiencia } };
      },
      deleteMyProfileInformation: async (id) => {
        called.push(['DELETE', id]);
        return { exists: false, profile: null };
      },
    };

    const controller = new MentorshipController(mockService);
    const req = { user: { id: 'test-user-id' } };

    await controller.getMyProfileInformation(req);
    await controller.updateMyProfileInformation(req, { experiencia: 'Mi experiencia' });
    await controller.deleteMyProfileInformation(req);

    assert.equal(called.length, 3);
    assert.equal(called[0][0], 'GET');
    assert.equal(called[0][1], 'test-user-id');
    assert.equal(called[1][0], 'PATCH');
    assert.equal(called[1][1], 'test-user-id');
    assert.equal(called[2][0], 'DELETE');
    assert.equal(called[2][1], 'test-user-id');
  });
});

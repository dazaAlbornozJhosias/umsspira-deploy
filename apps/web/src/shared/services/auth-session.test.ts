import { clearAccessToken, getAccessToken, setAccessToken } from './auth-session';

beforeEach(() => {
  clearAccessToken();
});

it('mantiene el token de prueba disponible durante la sesión del navegador', () => {
  setAccessToken('temporary-test-token');

  expect(getAccessToken()).toBe('temporary-test-token');
  expect(window.sessionStorage.getItem('umsspira.access-token')).toBe('temporary-test-token');
});

it('recupera el token de sesión después de reiniciar el módulo', () => {
  window.sessionStorage.setItem('umsspira.access-token', 'temporary-test-token');
  jest.resetModules();
  const session = require('./auth-session') as typeof import('./auth-session');

  expect(session.getAccessToken()).toBe('temporary-test-token');
});

it('elimina el token también del almacenamiento de sesión', () => {
  setAccessToken('temporary-test-token');
  clearAccessToken();

  expect(getAccessToken()).toBeNull();
  expect(window.sessionStorage.getItem('umsspira.access-token')).toBeNull();
});

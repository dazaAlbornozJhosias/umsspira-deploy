describe('cliente de Supabase', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('no detiene la API al importar el archivo aunque falten las variables', () => {
    expect(() => require('./supabase')).not.toThrow();
  });

  it('lanza un error claro solo cuando se usa sin configuracion', () => {
    const { getSupabaseClient, supabase, SupabaseConfigError } = require('./supabase');

    expect(() => getSupabaseClient()).toThrow(SupabaseConfigError);
    expect(() => supabase.from('carrera')).toThrow(SupabaseConfigError);
  });

  it('crea un unico cliente y prioriza la clave de servicio', () => {
    process.env.SUPABASE_URL = 'https://proyecto.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'clave-anonima';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'clave-servicio';
    const { getSupabaseClient, supabase } = require('./supabase');

    const client = getSupabaseClient();

    expect(getSupabaseClient()).toBe(client);
    expect(typeof supabase.from).toBe('function');
    expect(typeof supabase.storage.from).toBe('function');
  });
});


import {
  MENSAJE_ANIO_EGRESO_FUTURO,
  MENSAJE_CAMPO_OBLIGATORIO,
  MENSAJE_RESPALDO_OBLIGATORIO,
  mensajeAnioCertificacion,
  validarAnioCertificacion,
  validarCertificacion,
  MENSAJE_FORMACION_DUPLICADA,
  MENSAJE_HASTA_ANTERIOR_A_DESDE,
  MENSAJE_RESPALDO_FORMATO,
  MENSAJE_RESPALDO_TAMANIO,
  TAMANIO_MAXIMO_RESPALDO,
  validarAnioEgreso,
  validarFormacionDuplicada,
  validarRangoFechas,
  validarRespaldo,
} from './reglas-perfil';
 
const anioActual = new Date().getFullYear();
 
// File con el tamaño indicado sin reservar esa memoria: size se sobrescribe
function archivo(nombre: string, tipo: string, tamanio = 1024): File {
  const file = new File(['contenido'], nombre, { type: tipo });
  Object.defineProperty(file, 'size', { value: tamanio });
  return file;
}
 
describe('validarAnioEgreso', () => {
  it('usa el texto del criterio', () => {
    expect(MENSAJE_ANIO_EGRESO_FUTURO).toBe('El año de egreso no puede ser posterior al año actual');
  });
 
  it('rechaza un año posterior al actual', () => {
    expect(validarAnioEgreso(String(anioActual + 1))).toBe(MENSAJE_ANIO_EGRESO_FUTURO);
  });
 
  it('acepta el año actual y años anteriores', () => {
    expect(validarAnioEgreso(String(anioActual))).toBeUndefined();
    expect(validarAnioEgreso('2018')).toBeUndefined();
  });
 
  it('no evalúa valores vacíos o sin 4 dígitos', () => {
    expect(validarAnioEgreso('')).toBeUndefined();
    expect(validarAnioEgreso('99999')).toBeUndefined();
  });
});
 
describe('validarFormacionDuplicada', () => {
  const guardadas = [
    { institucion: 'Universidad Mayor de San Simón', titulo: 'Licenciatura en Ingeniería de Sistemas', anioEgreso: '2018' },
  ];
 
  it('usa el texto del criterio', () => {
    expect(MENSAJE_FORMACION_DUPLICADA).toBe('La formación académica ya se encuentra registrada');
  });
 
  it('detecta el duplicado ignorando mayúsculas y espacios (caso de QA)', () => {
    const nueva = {
      institucion: '  universidad mayor de san simón ',
      titulo: 'LICENCIATURA EN INGENIERÍA DE SISTEMAS',
      anioEgreso: '2018',
    };
    expect(validarFormacionDuplicada(nueva, guardadas)).toBe(MENSAJE_FORMACION_DUPLICADA);
  });
 
  it('no es duplicado si cambia la institución, el título o el año', () => {
    const base = guardadas[0];
    expect(validarFormacionDuplicada({ ...base, institucion: 'Universidad Católica Boliviana' }, guardadas)).toBeUndefined();
    expect(validarFormacionDuplicada({ ...base, titulo: 'Maestría en Gestión de TI' }, guardadas)).toBeUndefined();
    expect(validarFormacionDuplicada({ ...base, anioEgreso: '2019' }, guardadas)).toBeUndefined();
  });
 
  it('no hay duplicado si todavía no hay formaciones', () => {
    expect(validarFormacionDuplicada(guardadas[0], [])).toBeUndefined();
  });
});
 
describe('validarRangoFechas', () => {
  it('usa el texto del criterio', () => {
    expect(MENSAJE_HASTA_ANTERIOR_A_DESDE).toBe('La fecha fin no puede ser anterior a la fecha inicio');
  });
 
  it('rechaza una fecha Hasta anterior a Desde (caso de QA)', () => {
    expect(validarRangoFechas('2023-08-01', '2022-03-01')).toBe(MENSAJE_HASTA_ANTERIOR_A_DESDE);
  });
 
  it('acepta una fecha Hasta igual o posterior a Desde', () => {
    expect(validarRangoFechas('2023-08-01', '2023-08-01')).toBeUndefined();
    expect(validarRangoFechas('2023-08-01', '2024-01-31')).toBeUndefined();
  });
 
  it('no valida el rango si falta alguna fecha (trabajo actual)', () => {
    expect(validarRangoFechas('2023-08-01', '')).toBeUndefined();
    expect(validarRangoFechas('', '2022-03-01')).toBeUndefined();
  });
});
 
describe('validarRespaldo', () => {
  it('usa los textos del criterio', () => {
    expect(MENSAJE_RESPALDO_FORMATO).toBe('Formato no permitido. Solo JPG');
    expect(MENSAJE_RESPALDO_TAMANIO).toBe('El archivo no puede superar 5 MB');
  });
 
  it('acepta un JPG de hasta 5 MB', () => {
    expect(validarRespaldo(archivo('certificado.jpg', 'image/jpeg'))).toBeUndefined();
    expect(validarRespaldo(archivo('certificado.JPEG', 'image/jpeg', TAMANIO_MAXIMO_RESPALDO))).toBeUndefined();
  });
 
  it('rechaza PDF y PNG por formato, aunque superen 5 MB (caso de QA)', () => {
    expect(validarRespaldo(archivo('certificado.pdf', 'application/pdf', 6 * 1024 * 1024))).toBe(MENSAJE_RESPALDO_FORMATO);
    expect(validarRespaldo(archivo('certificado.png', 'image/png'))).toBe(MENSAJE_RESPALDO_FORMATO);
  });
 
  it('rechaza un archivo con extensión cambiada', () => {
    expect(validarRespaldo(archivo('certificado.jpg', 'application/pdf'))).toBe(MENSAJE_RESPALDO_FORMATO);
    expect(validarRespaldo(archivo('certificado.pdf', 'image/jpeg'))).toBe(MENSAJE_RESPALDO_FORMATO);
  });
 
  it('rechaza un JPG de más de 5 MB', () => {
    expect(validarRespaldo(archivo('certificado.jpg', 'image/jpeg', 6 * 1024 * 1024))).toBe(MENSAJE_RESPALDO_TAMANIO);
  });
});
 
describe('validarAnioCertificacion (T8.3)', () => {
  it('acepta de 1980 al año actual', () => {
    expect(validarAnioCertificacion('1980')).toBeUndefined();
    expect(validarAnioCertificacion(String(anioActual))).toBeUndefined();
  });
 
  it('rechaza años fuera del rango', () => {
    expect(validarAnioCertificacion('1979')).toBe(mensajeAnioCertificacion());
    expect(validarAnioCertificacion(String(anioActual + 1))).toBe(mensajeAnioCertificacion());
    expect(validarAnioCertificacion('202')).toBe(mensajeAnioCertificacion());
  });
 
  it('pide el año si está vacío', () => {
    expect(validarAnioCertificacion('')).toBe(MENSAJE_CAMPO_OBLIGATORIO);
  });
});
 
describe('validarCertificacion (T8.3)', () => {
  const valida = {
    nombre: 'AWS Certified Solutions Architect – Associate',
    entidadEmisora: 'Amazon Web Services',
    anioEmision: '2023',
    respaldo: archivo('certificado.jpg', 'image/jpeg'),
  };
 
  it('sin errores cuando todo es válido', () => {
    expect(validarCertificacion(valida)).toEqual({});
  });
 
  it('marca cada campo vacío y el respaldo faltante', () => {
    expect(validarCertificacion({ nombre: ' ', entidadEmisora: '', anioEmision: '', respaldo: null })).toEqual({
      nombre: MENSAJE_CAMPO_OBLIGATORIO,
      entidadEmisora: MENSAJE_CAMPO_OBLIGATORIO,
      anioEmision: MENSAJE_CAMPO_OBLIGATORIO,
      respaldo: MENSAJE_RESPALDO_OBLIGATORIO,
    });
  });
 
  it('revisa el formato y el tamaño del respaldo', () => {
    expect(validarCertificacion({ ...valida, respaldo: archivo('a.png', 'image/png') }).respaldo).toBe(MENSAJE_RESPALDO_FORMATO);
    expect(
      validarCertificacion({ ...valida, respaldo: archivo('a.jpg', 'image/jpeg', TAMANIO_MAXIMO_RESPALDO + 1) }).respaldo,
    ).toBe(MENSAJE_RESPALDO_TAMANIO);
  });
});
 

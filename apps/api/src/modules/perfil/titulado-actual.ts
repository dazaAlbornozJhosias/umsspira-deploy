import { ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

// Único sitio que decide qué titulado es el usuario que hace la petición.
// Mientras no exista el login (Épica 1) ni la columna titulado.id_usuario,
// se usa el titulado de prueba de la variable de entorno TITULADO_ID_PRUEBA.
// Cuando haya login: leer el usuario de req, buscar su titulado y responder 403 si no es titulado.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function obtenerTituladoId(req: Request): Promise<string> {
  const tituladoId = process.env.TITULADO_ID_PRUEBA;
  if (!tituladoId) {
    throw new ForbiddenException('El usuario no es un titulado');
  }
  return tituladoId;
}
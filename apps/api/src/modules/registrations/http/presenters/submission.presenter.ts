export function presentSubmission(result: { id: string; estado: string }) {
  return {
    idSolicitud: result.id,
    estado: result.estado,
    mensaje: 'Solicitud registrada correctamente',
  };
}

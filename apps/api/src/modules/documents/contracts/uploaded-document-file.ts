// Datos del archivo que entrega multer (almacenamiento en memoria) al controlador.
export interface UploadedDocumentFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

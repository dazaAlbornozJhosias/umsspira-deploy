export interface UploadedFileData {
  originalname: string;
  buffer: Buffer;
}

export interface StoredFile {
  id: string;
  name: string;
  mime: string;
  bytes: Uint8Array;
  size: number;
}

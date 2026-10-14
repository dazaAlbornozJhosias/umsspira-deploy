import { Injectable } from '@nestjs/common';
import { getSupabaseClient } from '../../../shared/lib/supabase';
import { DEFAULT_DOCUMENTS_BUCKET } from '../contracts/document.constants';

/**
 * Acceso a Supabase Storage para los documentos de respaldo.
 * El bucket es privado: los archivos solo se consultan con URL firmada desde el backoffice (HU-04).
 */
@Injectable()
export class DocumentsRepository {
  getBucketName(): string {
    return process.env.SUPABASE_DOCUMENTS_BUCKET || DEFAULT_DOCUMENTS_BUCKET;
  }

  async upload(path: string, content: Buffer, contentType: string): Promise<string> {
    const { data, error } = await getSupabaseClient()
      .storage.from(this.getBucketName())
      .upload(path, content, { contentType, upsert: false });
    if (error) throw error;
    return data.path;
  }
}

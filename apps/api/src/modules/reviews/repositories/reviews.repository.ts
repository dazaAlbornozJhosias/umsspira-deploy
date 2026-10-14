import { Injectable } from "@nestjs/common";
import { getSupabaseClient } from "../../../shared/lib/supabase";
import type { ApplicationStatus, ReviewResponse } from "@umsspira/shared-types"; // TODO: ajustar el nombre real del paquete
import { normalizeStatus } from "../contracts/application.contract";

export type ApplicantContact = { email: string; fullName: string };
type SaveReviewInput = Omit<ReviewResponse, "id" | "reviewedAt">;

@Injectable()
export class ReviewsRepository {
  // Solo se dictamina lo "Pendiente de validación" (la BD mezcla 'Pendiente' y 'PENDING').
  async getApplicationStatus(
    applicationId: string,
  ): Promise<ApplicationStatus | null> {
    const { data, error } = await getSupabaseClient()
      .from("solicitud")
      .select("id, estado")
      .eq("id", applicationId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return normalizeStatus(data.estado);
  }

  // Persiste el dictamen y actualiza la solicitud para que la bandeja
  // muestre el resultado (CA-04.4 y CA-04.5).
  async saveReview(input: SaveReviewInput): Promise<ReviewResponse> {
    const justification = [input.category, input.note].filter(Boolean).join("\n\n") || null;
    const { data: dictamen, error: dictamenError } = await getSupabaseClient()
      .from("dictamen")
      .insert({
        id_solicitud: input.applicationId,
        id_administrador_sistema: null,
        justificacion: justification,
        fecha_creacion: new Date().toISOString(),
        subsanada: false,
      })
      .select("id")
      .maybeSingle();
    if (dictamenError) throw dictamenError;

    const { error: updateError } = await getSupabaseClient()
      .from("solicitud")
      .update({ estado: input.status })
      .eq("id", input.applicationId);
    if (updateError) throw updateError;

    return {
      id: (dictamen?.id as string) ?? input.applicationId,
      reviewedAt: new Date().toISOString(),
      ...input,
    };
  }

  // Contacto real del titulado desde su solicitud (se usa al activar las notificaciones).
  async getApplicantContact(applicationId: string): Promise<ApplicantContact | null> {
    const { data: application, error: applicationError } = await getSupabaseClient()
      .from("solicitud")
      .select("id_detalle_solicitud")
      .eq("id", applicationId)
      .maybeSingle();
    if (applicationError) throw applicationError;
    if (!application?.id_detalle_solicitud) return null;

    const { data: detail, error: detailError } = await getSupabaseClient()
      .from("detalle_solicitud")
      .select("nombre, apellido, email")
      .eq("id", application.id_detalle_solicitud as string)
      .maybeSingle();
    if (detailError) throw detailError;
    if (!detail?.email) return null;

    return {
      email: detail.email as string,
      fullName: `${(detail.nombre as string) ?? ""} ${(detail.apellido as string) ?? ""}`.trim(),
    };
  }
}

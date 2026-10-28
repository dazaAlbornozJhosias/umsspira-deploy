import { apiFetch } from "./api-client";
import { getCurrentCompanyId } from "./companies";

export interface CreateJobPostingInput {
  titulo: string;
  modalidad: string;
  nivelExperiencia: string;
  descripcionTecnica: string;
}

export async function createJobPosting(
  input: CreateJobPostingInput,
): Promise<unknown> {
  return apiFetch("/api/v1/job-postings", {
    method: "POST",
    body: JSON.stringify({ ...input, empresaId: await getCurrentCompanyId() }),
  });
}

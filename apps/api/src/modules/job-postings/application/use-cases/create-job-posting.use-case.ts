import type { ActorContext } from '../../../../shared/security/contexts/actor-context';
import { assertJobPostingCompanyAccess } from '../../domain/policies/job-posting-access.policy';
import { JobPostingCompanyNotFoundError } from '../../domain/errors/job-posting-company-not-found.error';
import type { JobPosting } from '../../domain/entities/job-posting.entity';
import type { CreateJobPostingInput } from '../contracts/create-job-posting.input';
import type { JobPostingRepository } from '../ports/job-posting-repository.port';

export class CreateJobPostingUseCase {
  constructor(
    private readonly jobs: JobPostingRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(actor: ActorContext, input: CreateJobPostingInput): Promise<JobPosting> {
    assertJobPostingCompanyAccess(actor.scopes.companyIds, input.empresaId);
    const posting = await this.jobs.create(actor.id, input, this.now());
    if (!posting) {
      throw new JobPostingCompanyNotFoundError();
    }
    return posting;
  }
}

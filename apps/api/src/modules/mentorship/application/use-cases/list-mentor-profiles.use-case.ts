import type { MentorDirectoryQuery, MentorRepository } from '../ports/mentor-repository.port';

export class ListMentorProfilesUseCase {
  constructor(private readonly repository: MentorRepository) {}
  async execute(query?: MentorDirectoryQuery) {
    return this.repository.directory(query);
  }
}

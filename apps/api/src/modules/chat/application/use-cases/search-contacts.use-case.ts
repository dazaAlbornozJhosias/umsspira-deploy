import type { UserDirectory } from '../../../user/application/ports/user-directory.port';

export class SearchContactsUseCase {
  constructor(private readonly directory: UserDirectory) {}
  async execute(actorId: string, query: string, page: number) {
    const users = await this.directory.search(actorId, query, page);
    return { items: users.slice(0, 20), hasMore: users.length > 20 };
  }
}

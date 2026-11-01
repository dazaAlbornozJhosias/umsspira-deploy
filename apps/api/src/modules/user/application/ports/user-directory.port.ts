export interface DirectoryUser {
  id: string;
  name: string;
  role: string;
}

export const USER_DIRECTORY = Symbol('USER_DIRECTORY');
export interface UserDirectory {
  search(excludeId: string, query: string, page: number): Promise<DirectoryUser[]>;
  findActive(id: string): Promise<DirectoryUser | null>;
}

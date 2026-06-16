/**
 * Data layer behind a narrow interface so the service never knows whether it is
 * talking to Postgres/Prisma or memory. The in-memory implementation is what the
 * running app and tests use for this demo; the Prisma implementation is the
 * documented production path (see prismaUserRepository.ts), wired by swapping one
 * line in server.ts. Uniqueness is enforced case-insensitively (spec §3).
 */

export interface StoredUser {
  id: string;
  email: string; // stored normalized (lowercased, trimmed)
  passwordHash: string;
  createdAt: Date;
}

export interface UserRepository {
  findByEmail(email: string): Promise<StoredUser | null>;
  create(input: { email: string; passwordHash: string }): Promise<StoredUser>;
}

/** Normalize an email for storage and case-insensitive uniqueness. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

let counter = 0;
function nextId(): string {
  counter += 1;
  return `usr_${Date.now().toString(36)}${counter.toString(36)}`;
}

export class InMemoryUserRepository implements UserRepository {
  private readonly byEmail = new Map<string, StoredUser>();

  async findByEmail(email: string): Promise<StoredUser | null> {
    return this.byEmail.get(normalizeEmail(email)) ?? null;
  }

  async create(input: { email: string; passwordHash: string }): Promise<StoredUser> {
    const email = normalizeEmail(input.email);
    const user: StoredUser = {
      id: nextId(),
      email,
      passwordHash: input.passwordHash,
      createdAt: new Date(),
    };
    this.byEmail.set(email, user);
    return user;
  }
}

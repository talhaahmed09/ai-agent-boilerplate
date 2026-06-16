/**
 * Documented production data path — NOT wired for this demo (spec out-of-scope,
 * constitution: "Prisma documented, not wired"). It implements the same
 * UserRepository interface as the in-memory repo, so production is a one-line swap
 * in server.ts:  new PrismaUserRepository(prisma)  instead of  new InMemoryUserRepository().
 *
 * Left as a typed stub on purpose: enabling it requires installing @prisma/client,
 * running the migration in prisma/schema.prisma, and providing DATABASE_URL.
 */
import { UserRepository, StoredUser, normalizeEmail } from './userRepository';

// Shape of the Prisma client method surface we depend on, without importing the
// (uninstalled) @prisma/client. Replace with the real PrismaClient in production.
interface PrismaLike {
  user: {
    findUnique(args: { where: { email: string } }): Promise<StoredUser | null>;
    create(args: {
      data: { email: string; passwordHash: string };
    }): Promise<StoredUser>;
  };
}

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaLike) {}

  async findByEmail(email: string): Promise<StoredUser | null> {
    return this.prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
  }

  async create(input: { email: string; passwordHash: string }): Promise<StoredUser> {
    return this.prisma.user.create({
      data: { email: normalizeEmail(input.email), passwordHash: input.passwordHash },
    });
  }
}

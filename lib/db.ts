// Exposes a shared Prisma client and reuses it during development to avoid
// opening duplicate database connections on hot reloads.
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ["error", "warn"]
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

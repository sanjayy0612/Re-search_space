// Provides the default workspace lookup/creation used by the app.
import { prisma } from "@/lib/db";

export async function getOrCreateWorkspace() {
  const existing = await prisma.workspace.findFirst({
    orderBy: {
      createdAt: "asc"
    }
  });

  if (existing) {
    return existing;
  }

  return prisma.workspace.create({
    data: {
      name: "Weekend Research Workspace"
    }
  });
}

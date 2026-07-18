"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function getPendingFollowUps() {
  const session = await auth();
  if (!session?.user) return [];

  let whereClause: any = {};
  
  if (session.user.role === "COMMERCIAL") {
    whereClause = { opportunity: { band: { members: { some: { userId: session.user.id } } } } };
  }

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  return await prisma.task.findMany({
    where: {
      type: "FOLLOW_UP",
      isCompleted: false,
      dueDate: { lte: endOfToday },
      ...whereClause,
    },
    include: {
      opportunity: {
        include: {
          prospect: { select: { name: true, city: true } },
          band: { select: { name: true } },
        }
      }
    },
    orderBy: { dueDate: 'asc' },
    take: 10,
  });
}
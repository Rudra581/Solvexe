import { db } from ".";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";

export const getProblem = async (problemId: string, contestId?: string) => {
  console.log(`[DEBUG] db/problem.ts: getProblem called with problemId: "${problemId}", contestId: "${contestId}"`);
  if (contestId) {
    const contest = await db.contest.findFirst({
      where: {
        id: contestId,
        hidden: false,
      },
    });

    console.log(`[DEBUG] db/problem.ts: contest query result:`, contest ? `Found "${contest.title}"` : "Not Found");
    if (!contest) {
      return null;
    }


    const problem = await db.problem.findFirst({
      where: {
        id: problemId,
        contests: {
          some: {
            contestId: contestId,
          },
        },
      },
      include: {
        defaultCode: true,
      },
    });
    return problem;
  }

  const problem = await db.problem.findFirst({
    where: {
      id: problemId,
    },
    include: {
      defaultCode: true,
    },
  });
  return problem;
};

export const getProblems = async () => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const problems = await db.problem.findMany({
    include: {
      defaultCode: true,
      submissions: userId ? {
        where: {
          userId: userId,
          status: "AC",
          isRun: false,
        },
        take: 1,
      } : false,
    },
  });
  return problems;
};

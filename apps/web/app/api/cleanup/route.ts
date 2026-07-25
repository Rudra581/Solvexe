import { NextResponse } from "next/server";
import { db } from "../../db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const problems = await db.problem.findMany();
    let resetCount = 0;

    for (const prob of problems) {
      const uniqueSolvers = await db.submission.groupBy({
        by: ['userId'],
        where: {
          problemId: prob.id,
          status: 'AC'
        }
      });
      
      const realSolved = uniqueSolvers.length;
      
      if (prob.solved !== realSolved) {
        await db.problem.update({
          where: { id: prob.id },
          data: { solved: realSolved }
        });
        resetCount++;
      }
    }

    await db.$executeRaw`UPDATE "ContestPoints" SET points = 0 WHERE points < 0`;
    await db.$executeRaw`UPDATE "ContestSubmission" SET points = 0 WHERE points < 0`;

    return NextResponse.json({ 
      success: true, 
      message: `Database cleaned up successfully! Fixed the solved count for ${resetCount} problems.` 
    });
  } catch (error: any) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: "Cleanup failed", details: error.message }, { status: 500 });
  }
}

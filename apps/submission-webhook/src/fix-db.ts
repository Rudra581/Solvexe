import prismaClient from "./db";

async function main() {
  const problems = await prismaClient.problem.findMany();
  console.log("Problems:", problems.map((p: any) => ({ id: p.id, title: p.title, solved: p.solved })));

  const points = await prismaClient.contestPoints.findMany();
  console.log("Contest points:", points);
  
  const subs = await prismaClient.contestSubmission.findMany();
  console.log("Contest Submissions:", subs);

  await prismaClient.$executeRaw`UPDATE "ContestPoints" SET points = 0 WHERE points < 0`;
  await prismaClient.$executeRaw`UPDATE "ContestSubmission" SET points = 0 WHERE points < 0`;
  
  for (const prob of problems) {
    const uniqueSolvers = await prismaClient.submission.groupBy({
      by: ['userId'],
      where: { problemId: prob.id, status: 'AC' }
    });
    const realSolved = uniqueSolvers.length;
    
    if (prob.solved !== realSolved) {
      await prismaClient.problem.update({
        where: { id: prob.id },
        data: { solved: realSolved }
      });
      console.log(`Updated problem ${prob.title} solved count to ${realSolved} (was ${prob.solved})`);
    }
  }
}

main().catch(console.error).finally(() => prismaClient.$disconnect());

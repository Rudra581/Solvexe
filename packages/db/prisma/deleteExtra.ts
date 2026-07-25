import { prismaClient } from "../src";

async function main() {
  const deletedCode = await prismaClient.defaultCode.deleteMany({
    where: {
      problem: {
        slug: {
          in: ['sum-of-two-numbers', 'max-of-array']
        }
      }
    }
  });
  console.log(`Deleted ${deletedCode.count} default code entries.`);

  const result = await prismaClient.problem.deleteMany({
    where: {
      slug: {
        in: ['sum-of-two-numbers', 'max-of-array']
      }
    }
  });
  console.log(`Deleted ${result.count} extra problems.`);
}

main().catch(console.error).finally(() => prismaClient.$disconnect());

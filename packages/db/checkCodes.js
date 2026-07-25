const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const codes = await prisma.defaultCode.findMany({
    include: { problem: true }
  });
  console.log("DEFAULT CODES:");
  for (const code of codes) {
    console.log(`Problem: ${code.problem.slug}, LangID: ${code.languageId}, Code: ${code.code.substring(0, 20).replace(/\n/g, '\\n')}...`);
  }
}

main().catch(console.error).finally(()=>prisma.$disconnect());

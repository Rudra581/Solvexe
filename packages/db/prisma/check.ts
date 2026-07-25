import { prismaClient } from "../src";

async function main() {
  const codes = await prismaClient.defaultCode.findMany();
  console.log("DEFAULT CODES:", codes.map(c => ({ langId: c.languageId, problemId: c.problemId })));
}

main().catch(console.error).finally(() => prismaClient.$disconnect());

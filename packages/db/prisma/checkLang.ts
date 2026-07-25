import { prismaClient } from "../src";

async function main() {
  const languages = await prismaClient.language.findMany();
  console.log("LANGUAGES:", languages);
}

main().catch(console.error).finally(() => prismaClient.$disconnect());

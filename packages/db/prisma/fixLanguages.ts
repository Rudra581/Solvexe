import { prismaClient } from "../src";
import { LANGUAGE_MAPPING } from "@repo/common/language";

async function main() {
  await prismaClient.defaultCode.deleteMany();
  await prismaClient.language.deleteMany();

  await prismaClient.language.createMany({
    data: Object.keys(LANGUAGE_MAPPING).map((language) => ({
      id: LANGUAGE_MAPPING[language].internal,
      name: language,
      judge0Id: LANGUAGE_MAPPING[language].judge0,
    })),
  });
  console.log("Languages wiped and re-seeded correctly!");
}

main().catch(console.error).finally(() => prismaClient.$disconnect());

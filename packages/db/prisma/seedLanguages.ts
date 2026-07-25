import { LANGUAGE_MAPPING } from "@repo/common/language";
import { prismaClient } from "../src";

async function main() {
  await prismaClient.language.createMany({
    data: Object.keys(LANGUAGE_MAPPING).map((language) => ({
      id: LANGUAGE_MAPPING[language].internal,
      name: language,
      judge0Id: LANGUAGE_MAPPING[language].judge0,
    })),
    skipDuplicates: true,
  });
  console.log("Languages seeded successfully.");
}

main().catch(console.error).finally(() => prismaClient.$disconnect());

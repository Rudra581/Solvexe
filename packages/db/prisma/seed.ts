import { prismaClient } from "../src";
import { LANGUAGE_MAPPING } from "@repo/common/language";

async function seedLanguages() {
  await prismaClient.language.createMany({
    data: Object.keys(LANGUAGE_MAPPING).map((language) => ({
      id: LANGUAGE_MAPPING[language].internal,
      name: language,
      judge0Id: LANGUAGE_MAPPING[language].judge0,
    })),
    skipDuplicates: true,
  });
}

async function seedProblems() {
  // Problems are now synced dynamically from the filesystem.
  // Run `npm run db:seed` or the `syncAll.ts` script to populate problems.
  console.log("Problems should be synced from the apps/problems directory.");
}

(async () => {
  try {
    await seedLanguages();
    await seedProblems();
    console.log('Seed finished');
  } catch (err) {
    console.error('Seed error', err);
  } finally {
    await prismaClient.$disconnect();
  }
})();

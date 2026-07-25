import { LANGUAGE_MAPPING } from "@repo/common/language";
import fs from "fs";
import { prismaClient } from "../src";

const MOUNT_PATH = "../../apps/problems";

function promisifedReadFile(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, "utf8", (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
}

async function syncProblem(problemSlug: string) {
  const problemStatement = await promisifedReadFile(
    `${MOUNT_PATH}/${problemSlug}/Problem.md`,
  );

  const problem = await prismaClient.problem.upsert({
    where: {
      slug: problemSlug,
    },
    create: {
      title: problemSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      slug: problemSlug,
      description: problemStatement,
      hidden: false,
    },
    update: {
      description: problemStatement,
      hidden: false,
    },
  });

  await Promise.all(
    Object.keys(LANGUAGE_MAPPING).map(async (language) => {
      try {
        const code = await promisifedReadFile(
          `${MOUNT_PATH}/${problemSlug}/boilerplate/function.${language}`,
        );
        await prismaClient.defaultCode.upsert({
          where: {
            problemId_languageId: {
              problemId: problem.id,
              languageId: LANGUAGE_MAPPING[language].internal,
            },
          },
          create: {
            problemId: problem.id,
            languageId: LANGUAGE_MAPPING[language].internal,
            code,
          },
          update: {
            code,
          },
        });
      } catch (e) {
        // boilerplate for language might not exist
      }
    }),
  );
  console.log(`Synced problem: ${problemSlug}`);
}

async function main() {
  const problems = fs.readdirSync(MOUNT_PATH).filter(
    (file) => fs.statSync(`${MOUNT_PATH}/${file}`).isDirectory()
  );
  
  for (const problem of problems) {
    await syncProblem(problem);
  }
}

main().then(() => {
  console.log("Done");
  process.exit(0);
}).catch(console.error);

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Minimal language mapping used only for seeding default templates
const LANGUAGE_MAPPING = {
  cpp: { internal: 1, judge0: 54, name: 'cpp' },
  javascript: { internal: 63, judge0: 34, name: 'javascript' },
  python: { internal: 71, judge0: 71, name: 'python' },
};

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // seed languages
    const langs = Object.keys(LANGUAGE_MAPPING || {}).map((k) => ({
      id: LANGUAGE_MAPPING[k].internal,
      name: k,
      judge0Id: LANGUAGE_MAPPING[k].judge0,
    }));
    for (const l of langs) {
      try {
        await prisma.language.create({ data: l });
      } catch (e) { }
    }

    // seed problems if none exist
    const count = await prisma.problem.count();
    if (count === 0) {
      const problems = [
        {
          title: 'Sum of Two Numbers',
          description: 'Given two integers, output their sum.',
          slug: 'sum-of-two-numbers',
          hidden: false,
        },
        {
          title: 'Max of Array',
          description: 'Given an array of integers, find the maximum element.',
          slug: 'max-of-array',
          hidden: false,
        },
      ];

      for (const p of problems) {
        const created = await prisma.problem.create({ data: p });
        const languages = await prisma.language.findMany({ take: 3 });
        for (const lang of languages) {
          try {
            await prisma.defaultCode.create({
              data: {
                languageId: lang.id,
                problemId: created.id,
                code: `// ${p.title} - default template for ${lang.name}\n` +
                  (lang.name.toLowerCase().includes('cpp')
                    ? `#include <bits/stdc++.h>\nusing namespace std;\nint main(){int a,b; if(cin>>a>>b) cout<<(a+b)<<"\n"; return 0;}`
                    : lang.name.toLowerCase().includes('javascript') || lang.name.toLowerCase().includes('node')
                      ? `const fs = require('fs'); const input = fs.readFileSync(0,'utf8').trim().split(/\\s+/).map(Number); console.log(input[0] + input[1]);`
                      : `// Solve ${p.title}`),
              },
            });
          } catch (e) { }
        }
      }
    }

    console.log('JS seed finished');
  } catch (err) {
    console.error('Seed error', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seed();

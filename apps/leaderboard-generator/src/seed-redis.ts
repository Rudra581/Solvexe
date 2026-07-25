import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
import { prismaClient } from "../../../packages/db/src/index";
import Redis from "ioredis";


const redisUrl = process.env.REDIS_URL || "redis://dev_redis:6379";
const redis = new Redis(redisUrl);

async function seed() {
  console.log("Seeding Redis leaderboard from Postgres ContestSubmissions...");
  const liveContests = await prismaClient.contest.findMany({
    where: { hidden: false }
  });

  for (const contest of liveContests) {
    const submissions = await prismaClient.contestSubmission.findMany({
      where: { contestId: contest.id },
      include: { user: true }
    });

    const aggregated: Record<string, number> = {};
    for (const sub of submissions) {
      if (!aggregated[sub.userId]) {
        aggregated[sub.userId] = 0;
      }
      aggregated[sub.userId] += sub.points;
      
      await redis.hset(`contest:${contest.id}:usernames`, sub.userId, sub.user.name || sub.user.email);
      await redis.hset(`contest:${contest.id}:user:${sub.userId}:problems`, sub.problemId, sub.points);
    }

    for (const [userId, points] of Object.entries(aggregated)) {
      await redis.zadd(`contest:${contest.id}:leaderboard`, points, userId);
    }

    console.log(`Seeded contest "${contest.title}" with ${Object.keys(aggregated).length} users.`);
  }

  console.log("Seeding complete.");
  await prismaClient.$disconnect();
  redis.quit();
}

seed().catch(console.error);

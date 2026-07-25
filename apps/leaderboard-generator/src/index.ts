import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
import { prismaClient } from "../../..//packages/db/src/index";
import Redis from "ioredis";


const redisUrl = "redis://dev_redis:6379";
const redis = new Redis(redisUrl);

async function main() {
  while (true) {
    const liveContests = await prismaClient.contest.findMany({
      where: {
        hidden: false,
      },
    });

    console.log(`Checking ${liveContests.length} contests for archival`);

    await Promise.all(
      liveContests.map(async (contest) => {
        const isEnded = new Date(contest.endTime).getTime() < Date.now();
        
        const leaderboard = await redis.zrevrange(`contest:${contest.id}:leaderboard`, 0, -1, "WITHSCORES");
        
        if (leaderboard.length > 0) {
          const updates = [];
          for (let i = 0; i < leaderboard.length; i += 2) {
             const userId = leaderboard[i];
             const points = parseInt(leaderboard[i + 1]);
             const rank = (i / 2) + 1;
             updates.push({ userId, points, rank });
          }

          await prismaClient.$transaction(async (tx) => {
            for (const update of updates) {
              await tx.contestPoints.upsert({
                where: {
                  contestId_userId: {
                    contestId: contest.id,
                    userId: update.userId,
                  }
                },
                update: {
                  points: update.points,
                  rank: update.rank,
                },
                create: {
                  contestId: contest.id,
                  userId: update.userId,
                  points: update.points,
                  rank: update.rank,
                }
              });
            }
          });
          console.log(`Archived leaderboard for contest "${contest.title}" (${updates.length} users)`);
        }
        
        if (isEnded && leaderboard.length > 0) {
           console.log(`Contest ${contest.id} has ended. Cleaning up Redis keys and calculating ELO.`);
           
           const users = await prismaClient.user.findMany({
             where: { id: { in: updates.map(u => u.userId) } },
             select: { id: true, rating: true }
           });
           const ratingMap = new Map(users.map(u => [u.id, u.rating]));
           
           const K = 32;
           const newRatings = new Map<string, number>();
           
           for (const u1 of updates) {
             let expectedTotal = 0;
             let actualTotal = 0;
             const r1 = ratingMap.get(u1.userId) || 0;
             
             for (const u2 of updates) {
               if (u1.userId === u2.userId) continue;
               const r2 = ratingMap.get(u2.userId) || 0;
               const expected = 1 / (1 + Math.pow(10, (r2 - r1) / 400));
               expectedTotal += expected;
               
               if (u1.rank < u2.rank) actualTotal += 1;
               else if (u1.rank === u2.rank) actualTotal += 0.5;
             }
             
             const newRating = Math.max(0, Math.round(r1 + K * (actualTotal - expectedTotal)));
             newRatings.set(u1.userId, newRating);
           }
           
           await prismaClient.$transaction(async (tx) => {
             for (const [userId, rating] of newRatings.entries()) {
               await tx.user.update({
                 where: { id: userId },
                 data: { rating }
               });
             }
           });

           await redis.del(`contest:${contest.id}:leaderboard`);
           await redis.del(`contest:${contest.id}:usernames`);
           
           let cursor = '0';
           do {
             const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `contest:${contest.id}:user:*:problems`, 'COUNT', 100);
             cursor = nextCursor;
             if (keys.length > 0) {
                await redis.del(...keys);
             }
           } while (cursor !== '0');
        }
      })
    );

    // wait 1 minute before next archival
    await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
  }
}

main().catch(console.error);

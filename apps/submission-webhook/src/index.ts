import express from "express";
import prismaClient from "./db";
import { SubmissionCallback } from "@repo/common/zod";
import { outputMapping } from "./outputMapping";
import { getPoints } from "./points";

const app = express();
app.use(express.json());

app.put("/submission-callback", async (req, res) => {
  const secret = req.query.secret;
  if (secret !== process.env.WEBHOOK_SECRET) {
    console.error(`[DEBUG] webhook/index.ts - Unauthorized! req.query.secret = "${secret}", process.env.WEBHOOK_SECRET = "${process.env.WEBHOOK_SECRET}"`);
    return res.status(401).json({ error: "Unauthorized" });
  }

  const parsedBody = req.body;
  console.log(parsedBody);
  // if (!parsedBody.success) {
  //   return res.status(400).json({ message: "Invalid input" });
  // }

  console.log("[DEBUG] webhook/index.ts - Received webhook callback with payload:", JSON.stringify(parsedBody.data, null, 2));

  const statusResult = outputMapping[parsedBody.status.description];
  if (!statusResult) {
    console.error(`[DEBUG] webhook/index.ts - Unknown Judge0 status description: ${parsedBody.data.status.description}`);
    return res.status(400).json({ message: "Unknown status: " + parsedBody.data.status.description });
  }

  console.log(`[DEBUG] webhook/index.ts - Mapped Judge0 status "${parsedBody.status.description}" to database status: ${statusResult}`);

  try {
    let judgeOutput = "";
    if (parsedBody.stdout) {
      judgeOutput = parsedBody.stdout;
    } else if (parsedBody.compile_output) {
      judgeOutput = parsedBody.compile_output;
    } else if (parsedBody.stderr) {
      judgeOutput = parsedBody.stderr;
    } else if (parsedBody.message) {
      judgeOutput = parsedBody.message;
    }

    // Update the individual test case
    const testCase = await prismaClient.testCase.update({
      where: {
        judge0TrackingId: parsedBody.token,
      },
      data: {
        status: statusResult,
        time: parsedBody.time ? Number(parsedBody.time) : undefined,
        memory: parsedBody.memory ?? undefined,
        judgeOutput,
      },
    });

    // Use a transaction to safely check and update submission status
    let redisOperations: Array<() => Promise<void>> = [];
    await prismaClient.$transaction(async (tx) => {
      const pendingCount = await tx.testCase.count({
        where: {
          submissionId: testCase.submissionId,
          status: "PENDING",
        },
      });

      if (pendingCount === 0) {
        // All test cases are done — determine final status
        const allTestCases = await tx.testCase.findMany({
          where: { submissionId: testCase.submissionId },
        });

        const failedCount = allTestCases.filter((tc) => tc.status !== "AC").length;
        const accepted = failedCount === 0;

        const submission = await tx.submission.update({
          where: { id: testCase.submissionId },
          data: {
            status: accepted ? "AC" : "REJECTED",
            time: Math.max(...allTestCases.map((tc) => Number(tc.time || 0))),
            memory: Math.max(...allTestCases.map((tc) => tc.memory || 0)),
          },
          include: {
            problem: true,
            activeContest: true,
          },
        });
        console.log(`[DEBUG] webhook/index.ts - Updated final submission ${testCase.submissionId} status to: ${accepted ? "AC" : "REJECTED"}`);

        // Increment solve count on the problem
        if (accepted && !submission.isRun) {
          const previousAc = await tx.submission.findFirst({
            where: {
              userId: submission.userId,
              problemId: submission.problemId,
              status: "AC",
              id: { not: submission.id }
            }
          });
          if (!previousAc) {
            await tx.problem.update({
              where: { id: submission.problemId },
              data: { solved: { increment: 1 } },
            });
          }
        }

        // Handle contest points
        if (submission.activeContestId && submission.activeContest && accepted && !submission.isRun) {
          const basePoints = getPoints(
            submission.problem.difficulty,
            submission.activeContest.startTime,
            submission.activeContest.endTime,
          );

          const wrongSubmissionsCount = await tx.submission.count({
            where: {
              userId: submission.userId,
              problemId: submission.problemId,
              activeContestId: submission.activeContestId,
              status: "REJECTED",
              createdAt: {
                lt: submission.createdAt
              }
            }
          });

          const penalty = wrongSubmissionsCount * 50;
          const points = Math.max(0, basePoints - penalty);

          const oldContestSubmission = await tx.contestSubmission.findUnique({
            where: {
              userId_problemId_contestId: {
                contestId: submission.activeContestId,
                userId: submission.userId,
                problemId: submission.problemId,
              },
            }
          });
          const oldPoints = oldContestSubmission ? oldContestSubmission.points : 0;
          
          if (points > oldPoints) {
            const delta = points - oldPoints;

            await tx.contestSubmission.upsert({
              where: {
                userId_problemId_contestId: {
                  contestId: submission.activeContestId,
                  userId: submission.userId,
                  problemId: submission.problemId,
                },
              },
              create: {
                submissionId: submission.id,
                userId: submission.userId,
                problemId: submission.problemId,
                contestId: submission.activeContestId,
                points,
              },
              update: {
                points,
              },
            });

            const user = await tx.user.findUnique({ where: { id: submission.userId }});
            redisOperations.push(async () => {
              const redis = (await import("./redis")).default;
              await redis.zincrby(`contest:${submission.activeContestId}:leaderboard`, delta, submission.userId);
              await redis.hset(`contest:${submission.activeContestId}:user:${submission.userId}:problems`, submission.problemId, points);
              if (user) {
                await redis.hset(`contest:${submission.activeContestId}:usernames`, submission.userId, user.name || user.email);
              }
            });
          }
        }
      }
    });

    for (const op of redisOperations) {
      await op();
    }

    res.json({ message: "Received" });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.get("/health", (req, res) => {
  res.send("server is up ");
})
app.listen(3001, () => {
  console.log("Submission webhook server running on port", 3001);
});

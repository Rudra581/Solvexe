import { NextRequest, NextResponse } from "next/server";
import { SubmissionInput } from "@repo/common/zod";
import { getProblem } from "../../lib/problems";
import { JUDGE0_URI } from "../../lib/config";
import axios from "axios";
import { LANGUAGE_MAPPING } from "@repo/common/language";
import { db } from "../../db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { addToQueue } from "@repo/queue"
import redis from "../../lib/redis";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      {
        message: "You must be logged in to submit a problem",
      },
      {
        status: 401,
      },
    );
  }

  const rateLimitKey = `rate_limit:submission:${session.user.id}`;
  const currentCount = await redis.incr(rateLimitKey);
  if (currentCount === 1) {
    await redis.expire(rateLimitKey, 10);
  }
  if (currentCount > 5) {
    return NextResponse.json(
      { message: "Rate limit exceeded. Maximum 5 submissions per 10 seconds." },
      { status: 429 }
    );
  }

  const submissionInput = SubmissionInput.safeParse(await req.json());
  if (!submissionInput.success) {
    return NextResponse.json(
      {
        message: "Invalid input",
      },
      {
        status: 400,
      },
    );
  }

  const dbProblem = await db.problem.findUnique({
    where: {
      id: submissionInput.data.problemId,
    },
  });

  if (!dbProblem) {
    return NextResponse.json(
      {
        message: "Problem not found",
      },
      {
        status: 404,
      },
    );
  }

  const problem = await getProblem(
    dbProblem.slug,
    submissionInput.data.languageId,
  );
  console.log(problem);
  problem.fullBoilerplateCode = problem.fullBoilerplateCode.replace(
    "##USER_CODE_HERE##",
    submissionInput.data.code,
  );
console.log("Incoming Language ID:", submissionInput.data.languageId);
  const submission = await db.submission.create({
    data: {
      userId: session.user.id,
      problemId: submissionInput.data.problemId,
      languageId: LANGUAGE_MAPPING[submissionInput.data.languageId]?.internal!,
      code: submissionInput.data.code,
      fullCode: problem.fullBoilerplateCode,
      status: "PENDING",
      activeContestId: submissionInput.data.activeContestId,
      isRun: submissionInput.data.isRun ?? false,
    },
  });

  await addToQueue({
    submissionId: submission.id,
    code: problem.fullBoilerplateCode,
    languageId: LANGUAGE_MAPPING[submissionInput.data.languageId]?.judge0!,
    problemId: submissionInput.data.problemId,
    contestId: submissionInput.data.activeContestId,
    timeLimit: (dbProblem as any).timeLimit ?? 5,
    memoryLimit: (dbProblem as any).memoryLimit ?? 512000,
    testCases: (submissionInput.data.isRun ? problem.inputs.slice(0, 2) : problem.inputs).map((inputItem, index) => ({
      input: inputItem,
      expectedOutput: problem.outputs[index] ?? ""
    })),
  });

  return NextResponse.json(
    {
      message: "Submission made",
      id: submission.id,
    },
    {
      status: 200,
    },
  );
}



export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      {
        message: "You must be logged in to view submissions",
      },
      {
        status: 401,
      },
    );
  }
  const url = new URL(req.url);
  const searchParams = new URLSearchParams(url.search);
  const submissionId = searchParams.get("id");

  if (!submissionId) {
    return NextResponse.json(
      {
        message: "Invalid submission id",
      },
      {
        status: 400,
      },
    );
  }

  console.log(`[DEBUG] GET /api/submission - Polling for submission ${submissionId}`);

  let submission = await db.submission.findUnique({
    where: {
      id: submissionId,
      userId: session.user.id,
    },
  });

  if (!submission) {
    return NextResponse.json(
      {
        message: "Submission not found",
      },
      {
        status: 404,
      },
    );
  }

  let testCases = await db.testCase.findMany({
    where: {
      submissionId: submissionId,
    },
  });

  if (submission.status === "PENDING") {
    try {
      console.log(`Submission is PENDING, doing fallback check `);
      const tokens = testCases.filter((tc: any) => tc.status === "PENDING").map((tc: any) => tc.judge0TrackingId).join(",");
      if (tokens) {
        const judge0Res = await axios.get(`${JUDGE0_URI}/submissions/batch?tokens=${tokens}&base64_encoded=true&fields=token,status,time,memory,stdout,stderr,compile_output,message`, {
          headers: {
            "X-Auth-Token": "dev-token"
          }
        });
        let anyUpdated = false;
        if (judge0Res.data && judge0Res.data.submissions) {
          for (const sub of judge0Res.data.submissions) {
            if (sub.status && sub.status.id > 2) {
              console.log(`[DEBUG] Fallback Check: Found finished token ${sub.token} with status ${sub.status.description}. Triggering webhook...`);
              await axios.put(`http://app:3001/submission-callback?secret=${process.env.WEBHOOK_SECRET}`, {
                token: sub.token,
                status: sub.status,
                time: sub.time,
                memory: sub.memory,
                stdout: sub.stdout,
                stderr: sub.stderr,
                compile_output: sub.compile_output,
                message: sub.message
              }).catch(e => console.error("Webhook fallback trigger failed:", e.message));
              anyUpdated = true;
            }
          }
        }
        if (anyUpdated) {
          // Re-fetch after webhook processed
          submission = await db.submission.findUnique({
            where: { id: submissionId, userId: session.user.id },
          });
          testCases = await db.testCase.findMany({
            where: { submissionId: submissionId },
          });
        }
      }
    } catch (e: any) {
      console.error("[DEBUG] GET /api/submission - Judge0 fallback check failed:", e.message);
    }
  }

  return NextResponse.json(
    {
      submission,
      testCases,
    },
    {
      status: 200,
    },
  );
}

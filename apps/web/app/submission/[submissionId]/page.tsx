import { db } from "../../db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import Link from "next/link";
import { CheckIcon, CircleX, ClockIcon } from "lucide-react";

export default async function SubmissionPage({
  params,
}: {
  params: Promise<{ submissionId: string }>;
}) {
  const { submissionId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">Please sign in to view this submission.</p>
      </div>
    );
  }

  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    include: { problem: true, language: true, user: true },
  });

  if (!submission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Submission not found</h1>
          <p className="text-gray-500">
            The submission you are looking for does not exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <Link
          href={`/problem/${submission.problem.id}`}
          className="text-blue-500 hover:underline mb-2 inline-block"
        >
          &larr; Back to Problem
        </Link>
        <h1 className="text-3xl font-bold">{submission.problem.title} - Submission Details</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 overflow-hidden mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
            <div className="flex items-center gap-2 font-bold text-lg">
              {submission.status === "AC" && (
                <span className="text-green-500 flex items-center gap-1">
                  <CheckIcon className="w-5 h-5" /> Accepted
                </span>
              )}
              {submission.status === "REJECTED" && (
                <span className="text-red-500 flex items-center gap-1">
                  <CircleX className="w-5 h-5" /> Rejected
                </span>
              )}
              {submission.status === "PENDING" && (
                <span className="text-yellow-500 flex items-center gap-1">
                  <ClockIcon className="w-5 h-5" /> Pending
                </span>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Language</p>
            <p className="font-semibold">{submission.language.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Runtime</p>
            <p className="font-semibold">{submission.time ? `${submission.time} ms` : "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Memory</p>
            <p className="font-semibold">{submission.memory ? `${submission.memory} MB` : "N/A"}</p>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Submitted Code</h3>
          <div className="bg-gray-950 rounded-md p-4 overflow-x-auto">
            <pre className="text-sm text-gray-300 font-mono">
              <code>{submission.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

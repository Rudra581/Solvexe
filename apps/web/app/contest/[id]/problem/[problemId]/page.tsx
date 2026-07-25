import { ProblemStatement } from "../../../../../components/ProblemStatement";
import { ProblemSubmitBar } from "../../../../../components/ProblemSubmitBar";
import { getProblem } from "../../../../db/problem";
import { getContest } from "../../../../db/contest";

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ id: string; problemId: string }>;
}) {
  const { id, problemId } = await params;
  console.log(`[DEBUG] ProblemPage loaded with contestId: "${id}" and problemId: "${problemId}"`);
  
  const contest = await getContest(id);
  console.log(`[DEBUG] getContest result:`, contest ? `Found "${contest.title}"` : "Not Found");
  if (!contest) {

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Contest not found</h1>
        </div>
      </div>
    );
  }

  const isUpcoming = new Date(contest.startTime).getTime() > Date.now();
  if (isUpcoming) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Contest has not started yet</h1>
          <p className="text-gray-500">
            You cannot view problems for this contest until it begins.
          </p>
        </div>
      </div>
    );
  }

  const problem = await getProblem(problemId, id);

  if (!problem) {

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Problem not found</h1>
          <p className="text-gray-500">
            The problem you are looking for does not exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 overflow-y-auto max-h-[85vh]">
            <h1 className="text-2xl font-bold mb-4">{problem.title}</h1>
            <div className="prose prose-stone dark:prose-invert max-w-none">
              <ProblemStatement description={problem.description} />
            </div>
          </div>
          <ProblemSubmitBar contestId={id} problem={problem} />
        </div>
      </main>
    </div>
  );
}
export const dynamic = "force-dynamic";

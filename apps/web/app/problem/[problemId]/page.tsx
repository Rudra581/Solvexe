import { ProblemStatement } from "../../../components/ProblemStatement";
import { ProblemSubmitBar } from "../../../components/ProblemSubmitBar";
import { getProblem } from "../../db/problem";

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ problemId: string }>;
}) {
  const { problemId } = await params;
  const problem = await getProblem(problemId);

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
    <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
      <main className="flex-1 flex flex-col container mx-auto px-4 py-6 min-h-0">
        <div className="grid md:grid-cols-2 gap-6 flex-1 min-h-0">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 overflow-y-auto h-full min-h-0">
            <div className="prose prose-stone dark:prose-invert max-w-none">
              <ProblemStatement description={problem.description} />
            </div>
          </div>
          <div className="h-full min-h-0">
            <ProblemSubmitBar problem={problem} />
          </div>
        </div>
      </main>
    </div>
  );
}
export const dynamic = "force-dynamic";

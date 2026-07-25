import { ContestPointsTable } from "../../../components/ContestPointsTable";

export default async function Page({
  params,
}: {
  params: Promise<{ contestId: string }>;
}) {
  const { contestId } = await params;

  return (
    <div className="flex flex-col min-h-screen p-4 max-w-screen-md mx-auto">
      <div className="flex flex-col min-h-screen">
        <div className="container px-4 md:px-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Leaderboard</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Check out the live leaderboard
            </p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md">
            <div className="prose prose-stone dark:prose-invert">
              <ContestPointsTable contestId={contestId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

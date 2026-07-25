import { getContest } from "../app/db/contest";
import { ContestClock } from "./ContestClock";
import { ContestPoints } from "./ContestPoints";
import { ContestProblemsTable } from "./ContestProblemsTable";

export async function Contest({ id }: { id: string }) {
  const contest = await getContest(id);

  if (!contest) {
    return <div>Contest not found</div>;
  }

  const isUpcoming = new Date(contest.startTime).getTime() > Date.now();

  if (isUpcoming) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">{contest.title}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          This contest has not started yet. Stay tuned!
        </p>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Starts In
          </p>
          <ContestClock endTime={contest.startTime} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-flow-row-dense gap-4 grid-cols md:grid-cols-12 gap-4 grid-cols-1 min-h-screen px-2 md:px-12">
      <div className="col-span-9">
        <ContestProblemsTable contest={contest} />
      </div>
      <div className="col-span-3">
        <div className="col-span-3 pt-2 md:pt-24">
          <ContestClock endTime={contest.endTime} />
        </div>
        <div className="pt-2">
          <ContestPoints
            points={contest.contestSubmissions.reduce(
              (acc: number, curr: any) => acc + curr.points,
              0,
            )}
          />
        </div>
      </div>
    </div>
  );
}


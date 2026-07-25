import { getExistingContests, getUpcomingContests, getLiveContests } from "../app/db/contest";
import { ContestCard } from "./ContestCard";

export async function Contests() {
  const [liveContests, upcomingContests, pastContests] = await Promise.all([
    getLiveContests(),
    getUpcomingContests(),
    getExistingContests(),
  ]);
  return (
    <div className="w-full">
      <section className="bg-white dark:bg-gray-900 py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Live Contests</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Contests currently in progress. Participate now!
            </p>
          </div>
          {liveContests.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No live contests at the moment.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveContests.map((contest: any) => (
                <ContestCard
                  key={contest.id}
                  title={contest.title}
                  id={contest.id}
                  startTime={contest.startTime}
                  endTime={contest.endTime}
                />
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="bg-white dark:bg-gray-900 py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Upcoming Contests</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Check out the upcoming programming contests on Solvex.
            </p>
          </div>
          {upcomingContests.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No upcoming contests scheduled.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingContests.map((contest: any) => (
                <ContestCard
                  key={contest.id}
                  title={contest.title}
                  id={contest.id}
                  startTime={contest.startTime}
                  endTime={contest.endTime}
                />
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="bg-white dark:bg-gray-900 py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Previous Contests</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Check out the previous programming contests on Solvex.
            </p>
          </div>
          {pastContests.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No past contests available.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastContests.map((contest: any) => (
                <ContestCard
                  key={contest.id}
                  title={contest.title}
                  id={contest.id}
                  startTime={contest.startTime}
                  endTime={contest.endTime}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}


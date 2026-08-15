import { db } from "../app/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../app/lib/auth";

function getRankColor(rating: number) {
  if (rating < 1200) return "text-gray-500 font-semibold"; // Newbie
  if (rating < 1400) return "text-green-500 font-semibold"; // Pupil
  if (rating < 1600) return "text-cyan-500 font-semibold"; // Specialist
  if (rating < 1900) return "text-blue-500 font-semibold"; // Expert
  if (rating < 2100) return "text-purple-500 font-semibold"; // Candidate Master
  if (rating < 2300) return "text-orange-400 font-semibold"; // Master
  if (rating < 2400) return "text-orange-500 font-semibold"; // International Master
  return "text-red-500 font-bold"; // Grandmaster
}

function getRankTitle(rating: number) {
  if (rating < 1200) return "Newbie";
  if (rating < 1400) return "Pupil";
  if (rating < 1600) return "Specialist";
  if (rating < 1900) return "Expert";
  if (rating < 2100) return "Candidate Master";
  if (rating < 2300) return "Master";
  if (rating < 2400) return "International Master";
  return "Grandmaster";
}

export async function UserProfile() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, rating: true, email: true },
  });

  if (!user) return null;

  const rating = user.rating || 0;
  const rankClass = getRankColor(rating);
  const rankTitle = getRankTitle(rating);
  
  // Fetch solved problems count
  const solvedSubmissions = await db.submission.findMany({
    where: {
      userId: session.user.id,
      status: "AC",
      isRun: false,
    },
    distinct: ['problemId'],
    select: {
      problemId: true,
    }
  });
  const solvedCount = solvedSubmissions.length;

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-5 mt-8 font-sans">
      <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-gray-700">
        <h2 className="text-xl font-bold dark:text-white">Profile</h2>
        <span className={`text-sm px-2 py-1 border rounded ${rankClass} border-current`}>
          {rankTitle}
        </span>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <div className="mb-2">
            <span className="text-gray-500 dark:text-gray-400 text-sm">Handle: </span>
            <span className={`text-lg ${rankClass}`}>
              {user.name || user.email.split("@")[0]}
            </span>
          </div>
          
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 text-sm w-32">Contest Rating:</span>
              <span className={`text-xl ${rankClass}`}>{rating}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 text-sm w-32">Problems Solved:</span>
              <span className="text-xl font-semibold dark:text-gray-200">{solvedCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

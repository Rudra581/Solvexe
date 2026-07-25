import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Calculate the expected rank of user A among all users
function getExpectedRank(userRating: number, allRatings: number[]): number {
  let expectedRank = 1;
  for (const rating of allRatings) {
    if (rating !== userRating) {
      expectedRank += 1 / (1 + Math.pow(10, (rating - userRating) / 400));
    }
  }
  return expectedRank;
}

export async function calculateRatingsForContest(contestId: string) {
  console.log(`Calculating ratings for contest: ${contestId}`);
  
  // Get all users who participated (have contest points)
  const participants = await prisma.contestPoints.findMany({
    where: { contestId },
    include: { user: true },
    orderBy: [
      { points: 'desc' },
      // To strictly order, could add another tiebreaker here like time
    ],
  });

  if (participants.length === 0) {
    console.log("No participants found.");
    return;
  }

  // Assign actual ranks (handling ties if points are exactly equal)
  let currentRank = 1;
  for (let i = 0; i < participants.length; i++) {
    if (i > 0 && participants[i].points < participants[i - 1].points) {
      currentRank = i + 1;
    }
    participants[i].rank = currentRank;
  }

  const allRatings = participants.map(p => p.user.rating);

  // Calculate new ratings
  const K = 32; // Elo K-factor
  const ratingUpdates = participants.map(p => {
    const expectedRank = getExpectedRank(p.user.rating, allRatings);
    // Difference between expected rank and actual rank.
    // If expected is 5, but actual is 1, (5 - 1) = 4. 4 * K = positive increase.
    const rankDiff = expectedRank - p.rank;
    const ratingChange = Math.round(K * (rankDiff / (participants.length > 1 ? (participants.length / 2) : 1))); 
    
    // Clamp rating to not fall below 0
    const newRating = Math.max(0, p.user.rating + ratingChange);

    return {
      userId: p.userId,
      oldRating: p.user.rating,
      newRating,
      change: ratingChange,
    };
  });

  // Apply updates transactionally
  await prisma.$transaction(
    ratingUpdates.map(update => 
      prisma.user.update({
        where: { id: update.userId },
        data: { rating: update.newRating },
      })
    )
  );

  console.log("Ratings updated successfully!");
  console.table(ratingUpdates);
}

// If run from command line
if (require.main === module) {
  const contestId = process.argv[2];
  if (!contestId) {
    console.error("Please provide a contestId");
    process.exit(1);
  }
  calculateRatingsForContest(contestId)
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

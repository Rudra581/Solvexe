const POINT_MAPPING: Record<string, number> = {
  EASY: 500,
  MEDIUM: 1000,
  HARD: 1500,
};

export const getPoints = (
  difficulty: string,
  startTime: Date,
  endTime: Date,
): number => {
  const now = new Date();
  
  // If submission is before contest starts, no points
  if (now < startTime) return 0;
  
  // If submission is after contest ends, return max points for practice (or 0 depending on logic, Codeforces usually does not give rating points for practice but here we can just return standard points or 0)
  if (now > endTime) return 0;

  const maxPoints = POINT_MAPPING[difficulty] || POINT_MAPPING["EASY"]!;
  
  const minutesElapsed = Math.floor((now.getTime() - startTime.getTime()) / 60000);

  // Codeforces dynamic scoring formula:
  // Points decrease by maxPoints / 250 every minute.
  // Minimum points is 30% of maxPoints.
  const decreasePerMinute = maxPoints / 250;
  const currentPoints = maxPoints - (decreasePerMinute * minutesElapsed);

  return Math.max(Math.floor(maxPoints * 0.3), Math.floor(currentPoints));
};

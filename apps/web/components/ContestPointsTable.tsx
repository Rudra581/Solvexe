"use client";
import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@repo/ui/table";
import { useSession } from "next-auth/react";

interface ContestPoint {
  rank: number;
  points: number;
  user: {
    id: string;
    name: string | null;
  };
}

export function ContestPointsTable({
  contestId,
}: {
  contestId: string;
}) {
  const session = useSession();
  const [contestPoints, setContestPoints] = useState<ContestPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch(`/api/contest/${contestId}/leaderboard`);
        if (res.ok) {
          const data = await res.json();
          setContestPoints(data.contestPoints || []);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLeaderboard();
    
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, [contestId]);

  function getClassName(contestPoint: ContestPoint) {
    const userId = (session.data?.user as { id?: string } | undefined)?.id;
    return userId === contestPoint.user.id
      ? "font-extrabold text-green-500"
      : "text-gray-500";
  }

  if (loading && contestPoints.length === 0) {
    return <div className="text-center py-4">Loading leaderboard...</div>;
  }

  if (!loading && contestPoints.length === 0) {
    return <div className="text-center py-4 text-gray-500">No submissions yet.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Rank</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Points</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contestPoints.map((contestPoint) => (
          <TableRow key={`${contestPoint.rank}-${contestPoint.user.id}`}>
            <TableCell className={getClassName(contestPoint)}>
              {contestPoint.rank}
            </TableCell>
            <TableCell className={getClassName(contestPoint)}>
              {contestPoint.user.name}
            </TableCell>
            <TableCell className={getClassName(contestPoint)}>
              {contestPoint.points}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

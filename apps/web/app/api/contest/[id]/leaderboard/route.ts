import { NextResponse } from "next/server";
import redis from "../../../../lib/redis";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  try {
    const leaderboard = await redis.zrevrange(`contest:${id}:leaderboard`, offset, offset + limit - 1, "WITHSCORES");
    
    const results = [];
    for (let i = 0; i < leaderboard.length; i += 2) {
      const userId = leaderboard[i];
      const points = parseInt(leaderboard[i + 1] || "0");
      const rank = offset + (i / 2) + 1;
      
      const name = await redis.hget(`contest:${id}:usernames`, userId || "");
      
      results.push({
        rank,
        points,
        user: {
          id: userId,
          name: name || "Unknown User",
        }
      });
    }

    return NextResponse.json({ contestPoints: results });
  } catch (error) {
    console.error("Redis leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";

// Basic text similarity using character trigrams
function getTrigrams(str: string): Set<string> {
  const normalized = str.replace(/\s+/g, "").toLowerCase();
  const trigrams = new Set<string>();
  for (let i = 0; i < normalized.length - 2; i++) {
    trigrams.add(normalized.substring(i, i + 3));
  }
  return trigrams;
}

function calculateSimilarity(str1: string, str2: string): number {
  const set1 = getTrigrams(str1);
  const set2 = getTrigrams(str2);
  
  if (set1.size === 0 && set2.size === 0) return 1.0;
  if (set1.size === 0 || set2.size === 0) return 0.0;
  
  let intersection = 0;
  for (const trigram of set1) {
    if (set2.has(trigram)) {
      intersection++;
    }
  }
  
  const union = set1.size + set2.size - intersection;
  return intersection / union;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Basic auth check (can be restricted to ADMIN role in production)
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (user?.role !== "ADMIN") {
     return NextResponse.json({ message: "Forbidden. Admin access required." }, { status: 403 });
  }

  const url = new URL(req.url);
  const contestId = url.searchParams.get("contestId");
  const problemId = url.searchParams.get("problemId");

  if (!contestId || !problemId) {
    return NextResponse.json({ message: "contestId and problemId are required" }, { status: 400 });
  }

  // Fetch all accepted submissions for this problem in this contest
  const submissions = await db.submission.findMany({
    where: {
      problemId: problemId,
      activeContestId: contestId,
      status: "AC"
    },
    include: {
      user: true
    },
    orderBy: { createdAt: "asc" }
  });

  // Keep only the last successful submission per user to avoid comparing against themselves unnecessarily
  const userSubmissions = new Map<string, typeof submissions[0]>();
  for (const sub of submissions) {
    userSubmissions.set(sub.userId, sub);
  }

  const uniqueSubs = Array.from(userSubmissions.values());
  const suspiciousPairs = [];
  const SIMILARITY_THRESHOLD = 0.85; // 85% similarity threshold

  for (let i = 0; i < uniqueSubs.length; i++) {
    for (let j = i + 1; j < uniqueSubs.length; j++) {
      const sub1 = uniqueSubs[i];
      const sub2 = uniqueSubs[j];
      if (!sub1 || !sub2) continue;
      
      const similarity = calculateSimilarity(sub1.code, sub2.code);
      
      if (similarity >= SIMILARITY_THRESHOLD) {
        const u1 = (sub1 as any).user;
        const u2 = (sub2 as any).user;
        suspiciousPairs.push({
          user1: u1?.name || u1?.email || sub1.userId,
          user2: u2?.name || u2?.email || sub2.userId,
          similarity: Math.round(similarity * 100) + "%",
          submission1Id: sub1.id,
          submission2Id: sub2.id
        });
      }
    }
  }

  return NextResponse.json({
    analyzedSubmissions: uniqueSubs.length,
    suspiciousPairsCount: suspiciousPairs.length,
    suspiciousPairs
  }, { status: 200 });
}

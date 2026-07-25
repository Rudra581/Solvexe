import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@repo/ui/table";
import { getProblems } from "../app/db/problem";
import { CheckIcon } from "lucide-react";
import Link from "next/link";

export async function Problems() {
  let problems: any[] = [];

  try {
    problems = await getProblems();
  } catch (err) {
    console.error("Failed to fetch problems:", err);
  }

  return (
    <section className="bg-white dark:bg-gray-900 py-8 md:py-12 w-full min-h-screen">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight mb-2 text-gray-900 dark:text-white">
            Problems
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Master your algorithms with our curated list of problems.
          </p>
        </div>
        
        {problems.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No problems available yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
                <TableRow>
                  <TableHead className="w-16 text-center">Status</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-32">Difficulty</TableHead>
                  <TableHead className="w-32 text-center">Total Solves</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {problems.map((problem: any) => {
                  const hasSolved = problem.submissions && problem.submissions.length > 0;
                  return (
                    <TableRow 
                      key={problem.id} 
                      className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <TableCell className="text-center">
                        {hasSolved ? (
                          <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Link 
                          href={`/problem/${problem.id}`}
                          className="text-md font-medium text-blue-600 dark:text-blue-400 hover:underline group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors"
                        >
                          {problem.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className={getDifficultyColor(problem.difficulty) + " font-medium"}>
                          {problem.difficulty}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-gray-500 dark:text-gray-400">
                        {problem.solved}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </section>
  );
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case "EASY":
      return "text-emerald-500 dark:text-emerald-400";
    case "MEDIUM":
      return "text-amber-500 dark:text-amber-400";
    case "HARD":
      return "text-red-500 dark:text-red-400";
    default:
      return "text-gray-500";
  }
}

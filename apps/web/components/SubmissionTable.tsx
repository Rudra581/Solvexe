/**
 * v0 by Vercel.
 * @see https://v0.dev/t/pxkBLMqmzHi
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@repo/ui/table";
import { CheckIcon, ClockIcon, CircleX } from "lucide-react";
export interface ISubmission {
  id: string;
  time: string;
  memory: string;
  problemId: string;
  languageId: string;
  code: string;
  fullCode: string;
  status: string;
  testcases: {
    status: string;
    index: number;
  }[];
}

function getColor(status: string) {
  switch (status) {
    case "AC":
      return "text-green-500";
    case "FAIL":
      return "text-red-500";
    case "TLE":
      return "text-red-500";
    case "MLE":
      return "text-red-500";
    case "RTE":
      return "text-red-500";
    case "COMPILATION_ERROR":
      return "text-red-500";
    case "PENDING":
      return "text-yellow-500";
    case "REJECTED":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
}

function getIcon(status: string) {
  switch (status) {
    case "AC":
      return <CheckIcon className="h-4 w-4" />;
    case "FAIL":
      return <CircleX className="h-4 w-4" />;
    case "REJECTED":
      return <CircleX className="h-4 w-4" />;
    case "TLE":
      return <ClockIcon className="h-4 w-4" />;
    case "MLE":
      return <CircleX className="h-4 w-4" />;
    case "RTE":
      return <CircleX className="h-4 w-4" />;
    case "COMPILATION_ERROR":
      return <CircleX className="h-4 w-4" />;
    case "PENDING":
      return <ClockIcon className="h-4 w-4" />;
    default:
      return <ClockIcon className="h-4 w-4" />;
  }
}

export function SubmissionTable({
  submissions,
}: {
  submissions: ISubmission[];
}) {
  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg m-4">
        No submissions yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 m-4 shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50 dark:bg-gray-800/50">
          <TableRow>
            <TableHead className="font-medium">ID</TableHead>
            <TableHead className="font-medium">Status</TableHead>
            <TableHead className="font-medium">Testcases</TableHead>
            <TableHead className="font-medium">Runtime</TableHead>
            <TableHead className="font-medium">Memory</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => (
            <TableRow key={submission.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <TableCell className="text-gray-500 dark:text-gray-400 font-mono text-sm">
                {submission.id.substr(0, 8)}
              </TableCell>
              <TableCell>
                <div className={`flex items-center gap-2 font-medium ${getColor(submission.status)}`}>
                  {getIcon(submission.status)}
                  <span>{submission.status === "AC" ? "Accepted" : submission.status}</span>
                </div>
              </TableCell>
              <TableCell className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">
                  {submission.testcases?.filter((tc) => tc.status === "AC").length || 0}
                </span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-gray-500">{submission.testcases?.length || 0}</span>
              </TableCell>
              <TableCell className="text-gray-600 dark:text-gray-300">
                {submission.time ? `${submission.time} s` : "N/A"}
              </TableCell>
              <TableCell className="text-gray-600 dark:text-gray-300">
                {submission.memory ? `${submission.memory} KB` : "N/A"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

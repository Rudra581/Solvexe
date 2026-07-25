"use client";
import dynamic from "next/dynamic";
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

import { Tabs, TabsList, TabsTrigger } from "@repo/ui/tabs";
import { Button } from "@repo/ui/button";
import { useRouter } from "next/navigation";
import { Label } from "@repo/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@repo/ui/select";
import { useEffect, useState } from "react";
import { LANGUAGE_MAPPING } from "@repo/common/language";
import axios from "axios";
import { ISubmission, SubmissionTable } from "./SubmissionTable";
import { CheckIcon, CircleX, ClockIcon } from "lucide-react";
import { toast } from "react-toastify";

enum SubmitStatus {
  SUBMIT = "SUBMIT",
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  FAILED = "FAILED",
}

export interface IProblem {
  id: string;
  title: string;
  description: string;
  slug: string;
  defaultCode: {
    languageId: number;
    code: string;
  }[];
}

export const ProblemSubmitBar = ({
  problem,
  contestId,
}: {
  problem: IProblem;
  contestId?: string;
}) => {
  const [activeTab, setActiveTab] = useState("problem");

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 flex flex-col h-full min-h-0">
      <div className="mb-4 flex-none">
        <Tabs
          defaultValue="problem"
          className="rounded-md"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="problem">Submit</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className={`flex-1 min-h-0 flex flex-col ${activeTab === "problem" ? "" : "hidden"}`}>
        <SubmitProblem problem={problem} contestId={contestId} />
      </div>
      <div className={`flex-1 min-h-0 overflow-y-auto ${activeTab === "submissions" ? "" : "hidden"}`}>
        <Submissions problem={problem} />
      </div>
    </div>
  );
};

function Submissions({ problem }: { problem: IProblem }) {
  const [submissions, setSubmissions] = useState<ISubmission[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `/api/submission/bulk?problemId=${problem.id}`
        );
        setSubmissions(response.data.submissions || []);
      } catch (err) {
        // User might not be logged in — silently fail
        setSubmissions([]);
      }
    };
    fetchData();
  }, [problem.id]);
  return (
    <div>
      <SubmissionTable submissions={submissions} />
    </div>
  );
}

function SubmitProblem({
  problem,
  contestId,
}: {
  problem: IProblem;
  contestId?: string;
}) {
  const [language, setLanguage] = useState(
    Object.keys(LANGUAGE_MAPPING)[0] as string
  );
  const [code, setCode] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string>(SubmitStatus.SUBMIT);
  const [testcases, setTestcases] = useState<any[]>([]);

  useEffect(() => {
    const defaultCode: { [key: string]: string } = {};
    (problem.defaultCode || []).forEach((codeItem) => {
      const lang = Object.keys(LANGUAGE_MAPPING).find(
        (l) => LANGUAGE_MAPPING[l]?.internal === codeItem.languageId
      );
      if (!lang) return;
      defaultCode[lang] = codeItem.code;
    });
    setCode(defaultCode);
  }, [problem]);

  const router = useRouter();

  async function pollWithBackoff(id: string, retries: number, isRun: boolean = false) {
    if (retries === 0) {
      setStatus(SubmitStatus.SUBMIT);
      toast.error("Not able to get status ");
      return;
    }

    const response = await axios.get(`/api/submission/?id=${id}`);

    if (response.data.submission.status === "PENDING") {
      setTestcases(response.data.testCases);
      await new Promise((resolve) => setTimeout(resolve, 2.5 * 1000));
      pollWithBackoff(id, retries - 1, isRun);
    } else {
      if (response.data.submission.status === "AC") {
        setStatus(SubmitStatus.ACCEPTED);
        setTestcases(response.data.testCases);
        toast.success(isRun ? "Run Passed!" : "Accepted!");
        if (!isRun) {
          router.push(`/submission/${id}`);
        }
        return;
      } else {
        setStatus(SubmitStatus.FAILED);
        
        const testcases = response.data.testCases || [];
        let errorMessage = "Failed :(";
        if (testcases.some((tc: any) => tc.status === "COMPILATION_ERROR")) errorMessage = "Compilation Error";
        else if (testcases.some((tc: any) => tc.status === "TLE")) errorMessage = "Time Limit Exceeded";
        else if (testcases.some((tc: any) => tc.status === "MLE")) errorMessage = "Memory Limit Exceeded";
        else if (testcases.some((tc: any) => tc.status === "RTE")) errorMessage = "Runtime Error";
        else if (testcases.some((tc: any) => tc.status === "FAIL")) errorMessage = "Wrong Answer";

        toast.error(isRun ? `Run Failed: ${errorMessage}` : errorMessage);
        setTestcases(testcases);
        return;
      }
    }
  }

  async function submit(isRun: boolean = false) {
    setStatus(SubmitStatus.PENDING);
    setTestcases((t) => t.map((tc) => ({ ...tc, status: "PENDING" })));
    try {
      const response = await axios.post(`/api/submission/`, {
        code: code[language],
        languageId: language,
        problemId: problem.id,
        activeContestId: contestId,
        isRun,
      });
      pollWithBackoff(response.data.id, 60, isRun);
    } catch (err: any) {
      setStatus(SubmitStatus.SUBMIT);
      const errorMsg = err.response?.data?.details 
        ? JSON.stringify(err.response.data.details)
        : err.response?.data?.message || "Submission failed. Are you logged in?";
      toast.error(errorMsg);
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="flex-none">
        <Label htmlFor="language">Language</Label>
        <Select
          value={language}
          defaultValue="cpp"
          onValueChange={(value) => setLanguage(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(LANGUAGE_MAPPING).map((lang) => (
              <SelectItem key={lang} value={lang}>
                {LANGUAGE_MAPPING[lang]?.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div
        className="flex-1 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 min-h-0"
      >
        <MonacoEditor
          height="100%"
          value={code[language] || ""}
          theme="vs-dark"
          onMount={() => {}}
          options={{
            fontSize: 14,
            scrollBeyondLastLine: false,
            minimap: { enabled: false },
            padding: { top: 16 },
          }}
          language={LANGUAGE_MAPPING[language]?.monaco}
          onChange={(value) => {
            setCode({ ...code, [language]: value ?? "" });
          }}
          defaultLanguage="javascript"
        />
      </div>
      <div className="flex justify-end flex-none gap-2">
        <Button
          disabled={status === SubmitStatus.PENDING}
          type="button"
          variant="secondary"
          className="mt-2"
          onClick={() => submit(true)}
        >
          Run
        </Button>
        <Button
          disabled={status === SubmitStatus.PENDING}
          type="submit"
          className="mt-2"
          onClick={() => submit(false)}
        >
          {status === SubmitStatus.PENDING ? "Submitting..." : "Submit"}
        </Button>
      </div>
      <div className="flex-none overflow-y-auto max-h-48">
        <RenderTestcase testcases={testcases} />
      </div>
    </div>
  );
}

function renderResult(status: string, small: boolean = false) {
  const sizeClass = small ? "h-4 w-4" : "h-6 w-6";
  switch (status) {
    case "AC":
      return <CheckIcon className={`${sizeClass} text-green-500`} />;
    case "FAIL":
      return <CircleX className={`${sizeClass} text-red-500`} />;
    case "TLE":
      return <ClockIcon className={`${sizeClass} text-red-500`} />;
    case "MLE":
      return <CircleX className={`${sizeClass} text-red-500`} />;
    case "RTE":
      return <CircleX className={`${sizeClass} text-red-500`} />;
    case "COMPILATION_ERROR":
      return <CircleX className={`${sizeClass} text-red-500`} />;
    case "PENDING":
      return <ClockIcon className={`${sizeClass} text-yellow-500`} />;
    default:
      return <div className="text-gray-500"></div>;
  }
}

function RenderTestcase({ testcases }: { testcases: any[] }) {
  const [selectedCase, setSelectedCase] = useState(0);

  if (!testcases || testcases.length === 0) return null;

  const current = testcases[selectedCase];

  return (
    <div className="mt-4">
      <div className="flex gap-2 overflow-x-auto mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
        {testcases.map((tc, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedCase(idx)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-t-md text-sm whitespace-nowrap ${selectedCase === idx ? 'bg-gray-100 dark:bg-gray-800 font-semibold border-b-2 border-blue-500' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-500 border-b-2 border-transparent'}`}
          >
            {renderResult(tc.status, true)} Case {idx + 1}
          </button>
        ))}
      </div>
      
      {current && (
        <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-md text-sm font-mono">
          {current.status === "COMPILATION_ERROR" ? (
            <div>
              <p className="text-red-500 dark:text-red-400 font-semibold mb-2 flex items-center gap-2">
                <CircleX className="h-5 w-5" /> Compile Error
              </p>
              <div className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 p-3 rounded border border-red-200 dark:border-red-800/50 overflow-x-auto whitespace-pre-wrap">
                {current.judgeOutput || "Compilation failed with no output."}
              </div>
            </div>
          ) : (
            <>
              {current.input && (
                <div className="mb-4">
                  <p className="text-gray-500 dark:text-gray-400 mb-1 font-semibold">Input</p>
                  <div className="bg-white dark:bg-gray-950 p-3 rounded border border-gray-200 dark:border-gray-800 overflow-x-auto whitespace-pre-wrap">
                    {current.input.trim()}
                  </div>
                </div>
              )}
              
              <div className="mb-4">
                <p className="text-gray-500 dark:text-gray-400 mb-1 font-semibold">Output</p>
                <div className="bg-white dark:bg-gray-950 p-3 rounded border border-gray-200 dark:border-gray-800 overflow-x-auto whitespace-pre-wrap">
                  {current.judgeOutput?.trim() || (current.status === "PENDING" ? "Running..." : (current.status === "AC" && current.expectedOutput ? current.expectedOutput.trim() : "No output"))}
                </div>
              </div>
              
              {current.status !== "PENDING" && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400 mb-1 font-semibold">Expected</p>
                  <div className="bg-white dark:bg-gray-950 p-3 rounded border border-gray-200 dark:border-gray-800 overflow-x-auto whitespace-pre-wrap">
                    {current.expectedOutput?.trim() || "N/A"}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

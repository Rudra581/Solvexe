import { TestCaseResult } from "@prisma/client";

export const outputMapping: Record<string, TestCaseResult> = {
  "Accepted": TestCaseResult.AC,
  "Wrong Answer": TestCaseResult.FAIL,
  "Time Limit Exceeded": TestCaseResult.TLE,
  "Memory Limit Exceeded": TestCaseResult.MLE,
  "Runtime Error (NZEC)": TestCaseResult.RTE,
  "Runtime Error (SIGSEGV)": TestCaseResult.RTE,
  "Runtime Error (SIGXFSZ)": TestCaseResult.RTE,
  "Runtime Error (SIGFPE)": TestCaseResult.RTE,
  "Runtime Error (SIGABRT)": TestCaseResult.RTE,
  "Runtime Error (Other)": TestCaseResult.RTE,
  "Compilation Error": TestCaseResult.COMPILATION_ERROR,
  "Rejected": TestCaseResult.FAIL,
  "Internal Error": TestCaseResult.FAIL,
  "Exec Format Error": TestCaseResult.FAIL,
};

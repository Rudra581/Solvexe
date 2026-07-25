import fs from "fs";
import { readdir, readFile } from "fs/promises";
import path from "path";
type SUPPORTED_LANGS = "js" | "cpp" | "rs";

interface Problem {
  id: string;
  fullBoilerplateCode: string;
  inputs: string[];
  outputs: string[];
}

const MOUNT_PATH = process.env.MOUNT_PATH ?? (fs.existsSync("/app/apps/problems") ? "/app/apps/problems" : path.join(process.cwd(), "../../apps/problems"));

export const getProblem = async (
  problemId: string,
  languageId: SUPPORTED_LANGS,
): Promise<Problem> => {
  // concurrently to speed up file I/O
  const [fullBoilerplateCode, inputs, outputs] = await Promise.all([
    getProblemFullBoilerplateCode(problemId, languageId),
    getProblemInputs(problemId),
    getProblemOutputs(problemId)
  ]);

  return {
    id: problemId,
    fullBoilerplateCode,
    inputs,
    outputs,
  };
};

async function getProblemFullBoilerplateCode(
  problemId: string,
  languageId: SUPPORTED_LANGS,
): Promise<string> {
  const filePath = path.join(MOUNT_PATH, problemId, "boilerplate-full", `function.${languageId}`);
  try {
    // fs/promises natively returns a Promise, so no wrapper is needed
    return await readFile(filePath, "utf-8");
  } catch (error) {
    console.error(`Failed to load boilerplate for ${problemId} (${languageId}):`, error);
    throw error;
  }
}

async function getProblemInputs(problemId: string): Promise<string[]> {
  const inputsPath = path.join(MOUNT_PATH, problemId, "tests", "inputs");

  try {
    const files = await readdir(inputsPath);
    //sort - just to ensure 10.in wont comes/run  before 2.in bcz we are async fetched file
    files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const readPromises = files.map((file) => 
      readFile(path.join(inputsPath, file), "utf-8")
    );
    return await Promise.all(readPromises);

  } catch (error) {
    console.error(`Failed to load inputs for ${problemId}:`, error);
    throw error;
  }
}

async function getProblemOutputs(problemId: string): Promise<string[]> {
  const outputsPath = path.join(MOUNT_PATH, problemId, "tests", "outputs");

  try {
    const files = await readdir(outputsPath);

    // Sort to guarantee 10.out comes after 2.out, matching the inputs
    files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const readPromises = files.map((file) =>
      readFile(path.join(outputsPath, file), "utf-8")
    );

    return await Promise.all(readPromises);
  } catch (error) {
    console.error(`Failed to load outputs for ${problemId}:`, error);
    throw error;
  }
}

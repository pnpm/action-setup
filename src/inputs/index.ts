import { getInput } from "@actions/core";
import expandTilde from "expand-tilde";
import { RunInstall, parseRunInstall } from "./run-install";

export interface Inputs {
  readonly version?: string;
  readonly dest: string;
  readonly runInstall: RunInstall[];
}

export function getInputs(): Inputs {
  const dest = expandTilde(getInput("dest"));
  let version: string | undefined = getInput("version");
  if (version === "") version = undefined;
  const runInstall = parseRunInstall(getInput("run_install"));
  return { version, dest, runInstall };
}

export default getInputs;

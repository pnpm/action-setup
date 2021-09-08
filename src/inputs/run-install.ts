import process from "process";
import { load } from "js-yaml";
import Ajv from "ajv";
import { getInput, error } from "@actions/core";
import runInstallSchema from "./run-install-input.schema.json";

export interface RunInstall {
  readonly recursive?: boolean;
  readonly cwd?: string;
  readonly args?: readonly string[];
}

export type RunInstallInput = null | boolean | RunInstall | RunInstall[];

export function parseRunInstall(name: string): RunInstall[] {
  const runInstall = getInput(name, { required: false });
  if (runInstall === "") return [];

  const result: RunInstallInput = load(runInstall) as any;
  const ajv = new Ajv({
    allErrors: true,
  });
  const validate = ajv.compile(runInstallSchema);
  if (!validate(result)) {
    for (const errorItem of validate.errors!) {
      error(`with.run_install${errorItem.dataPath}: ${errorItem.message}`);
    }
    return process.exit(1);
  }
  if (!result) return [];
  if (result === true) return [{ recursive: true }];
  if (Array.isArray(result)) return result;
  return [result];
}

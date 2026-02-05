import { setFailed, startGroup, endGroup } from "@actions/core";
import { Inputs } from "../inputs";
import runSelfInstaller from "./run";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function install(inputs: Inputs) {
  try {
    await execAsync("pnpm --version");
    return;
  } catch {}

  startGroup("Running self-installer...");
  const status = await runSelfInstaller(inputs);
  endGroup();

  if (status) {
    setFailed(`Something went wrong, self-installer exits with code ${status}`);
  }
}

export default install;

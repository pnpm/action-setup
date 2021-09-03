import { startGroup, endGroup } from "@actions/core";
import { Inputs } from "../inputs";
import { runSelfInstaller } from "./run";
import { installFromGithubRelease } from "./githubRelease";
import * as semver from "semver";

export interface InstallLocation {
  readonly installFolder: string;
  readonly dest?: string;
}

export async function install(inputs: Inputs): Promise<InstallLocation> {
  if (inputs.version) {
    const ver = semver.parse(inputs.version);
    if (ver && semver.lt(ver, "6.13.0")) {
      startGroup("Running self-installer...");
      const binDir = await runSelfInstaller(inputs);
      endGroup();
      return {
        installFolder: binDir,
        dest: inputs.dest,
      };
    }
  }

  startGroup("Installing from github releases...");
  const installFolder = await installFromGithubRelease(inputs);
  endGroup();
  return {
    installFolder,
  };
}

export default install;

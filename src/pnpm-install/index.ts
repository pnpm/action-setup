import { spawnSync } from "child_process";
import path from "path";
import { setFailed, startGroup, endGroup } from "@actions/core";
import { Inputs } from "../inputs";
import { InstallLocation } from "../install-pnpm";

export function runPnpmInstall(inputs: Inputs, installLoc: InstallLocation) {
  const env = {
    ...process.env,
    PATH: installLoc.installFolder + path.delimiter + process.env.PATH,
  };

  for (const options of inputs.runInstall) {
    const args = ["install"];
    if (options.recursive) args.unshift("recursive");
    if (options.args) args.push(...options.args);

    const cmdStr = ["pnpm", ...args].join(" ");
    startGroup(`Running ${cmdStr}...`);

    const { error, status } = spawnSync("pnpm", args, {
      stdio: "inherit",
      cwd: options.cwd,
      shell: true,
      env,
    });

    endGroup();

    if (error) {
      setFailed(error);
      continue;
    }

    if (status) {
      setFailed(
        `Command ${cmdStr} (cwd: ${options.cwd}) exits with status ${status}`
      );
      continue;
    }
  }
}

export default runPnpmInstall;

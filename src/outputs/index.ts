import { addPath, setOutput } from "@actions/core";
import { InstallLocation } from "../install-pnpm";

export function setOutputs(install: InstallLocation) {
  setOutput("bin_dest", install.installFolder);
  addPath(install.installFolder);
  if (install.dest) {
    setOutput("dest", install.dest);
  }
}

export default setOutputs;

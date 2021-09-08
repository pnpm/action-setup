import { setFailed } from "@actions/core";
import getInputs from "./inputs";
import setOutputs from "./outputs";
import installPnpm from "./install-pnpm";
import pnpmInstall from "./pnpm-install";

async function main() {
  const inputs = getInputs();
  const installLoc = await installPnpm(inputs);
  console.log("Installation Completed!");
  setOutputs(installLoc);
  pnpmInstall(inputs, installLoc);
}

main().catch((error) => {
  console.error(error);
  setFailed(error);
});

import { spawn } from "child_process";
import { execPath } from "process";
import { join } from "path";
import { remove, ensureFile, writeFile } from "fs-extra";
import fetch from "node-fetch";
import { Inputs } from "../inputs";

export async function runSelfInstaller(inputs: Inputs): Promise<string> {
  const { version, dest } = inputs;
  const target = version ? `pnpm@${version}` : "pnpm";
  const pkgJson = join(dest, "package.json");

  await remove(dest);
  await ensureFile(pkgJson);
  await writeFile(pkgJson, JSON.stringify({ private: true }));

  const cp = spawn(execPath, ["-", "install", target, "--no-lockfile"], {
    cwd: dest,
    stdio: ["pipe", "inherit", "inherit"],
  });

  const response = await fetch("https://pnpm.js.org/pnpm.js");
  response.body.pipe(cp.stdin);

  const status: number = await new Promise((resolve, reject) => {
    cp.on("error", reject);
    cp.on("close", resolve);
  });

  if (status) {
    throw new Error(`pnpm self installer exited with status ${status}`);
  } else {
    return join(inputs.dest, "node_modules", ".bin");
  }
}

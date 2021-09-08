import { Inputs } from "../inputs";
import * as tc from "@actions/tool-cache";
import { info } from "@actions/core";
import { Octokit } from "@octokit/rest";
import * as semver from "semver";
import * as fs from "fs";
import * as util from "util";
const chmod = util.promisify(fs.chmod);

export async function installFromGithubRelease(
  inputs: Inputs
): Promise<string> {
  let releaseExeName: string;
  let targetExeName: string;
  let needChmod: boolean = false;
  if (process.platform === "win32") {
    releaseExeName = "pnpm-win-x64.exe";
    targetExeName = "pnpm.exe";
  } else if (process.platform === "darwin") {
    releaseExeName = "pnpm-macos-x64";
    targetExeName = "pnpm";
  } else {
    releaseExeName = "pnpm-linux-x64";
    targetExeName = "pnpm";
    needChmod = true;
  }

  let verToInstall: string;
  let downloadUrl: string;
  if (inputs.version && semver.valid(inputs.version)) {
    // a specific version is requested
    verToInstall = semver.clean(inputs.version)!;
    downloadUrl = `https://github.com/pnpm/pnpm/releases/download/v${verToInstall}/${releaseExeName}`;
  } else {
    // search for version by pattern in inputs.version or use latest
    const octokit = new Octokit();
    const allReleases = await octokit.repos.listReleases({
      owner: "pnpm",
      repo: "pnpm",
    });
    const releases = allReleases.data.filter((r) => {
      if (inputs.version) {
        const ver = semver.parse(r.tag_name);
        return ver && semver.satisfies(ver, inputs.version);
      } else {
        return semver.valid(r.tag_name) && !r.prerelease && !r.draft;
      }
    });

    if (releases.length === 0) {
      throw new Error(
        `Unable to find any pnpm releases matching ${inputs.version}`
      );
    }

    const release = releases.reduce((max, r) =>
      semver.gt(max.tag_name, r.tag_name) ? max : r
    );

    verToInstall = semver.clean(release.tag_name)!;
    downloadUrl = release.assets.find(
      (a) => a.name === releaseExeName
    )!.browser_download_url;
  }

  const cachedToolPath = tc.find("pnpm", verToInstall);
  if (!cachedToolPath) {
    info("Downloading " + downloadUrl);
    const pnpmDownloadPath = await tc.downloadTool(downloadUrl);
    if (needChmod) {
      await chmod(pnpmDownloadPath, 0o755);
    }
    return await tc.cacheFile(
      pnpmDownloadPath,
      targetExeName,
      "pnpm",
      verToInstall
    );
  } else {
    info("Loading from tool cache");
    return cachedToolPath;
  }
}

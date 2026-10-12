import { spawnSync } from "node:child_process";
import {
  readFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../../", import.meta.url));
const args = process.argv.slice(2);
if (args.some((a) => !["--debug"].includes(a)))
  throw new Error("Only --debug is supported by this local build wrapper.");
const run = (cmd, argv, options = {}) => {
  const r = spawnSync(cmd, argv, { cwd: root, encoding: "utf8", ...options });
  if (r.status !== 0)
    throw new Error(`${path.basename(cmd)} failed (${r.status})`);
  return r.stdout;
};
const sha = (b) => createHash("sha256").update(b).digest("hex");
function sourceHash() {
  const files = run("git", [
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "-z",
  ])
    .split("\0")
    .filter(
      (p) =>
        p &&
        !p.startsWith("artifacts/") &&
        !p.startsWith(".agents/") &&
        !p.includes("src-tauri/examples/"),
    );
  return sha(
    files
      .sort()
      .map((p) =>
        existsSync(path.join(root, p))
          ? `${p}:${sha(readFileSync(path.join(root, p)))}`
          : `${p}:missing`,
      )
      .join("\n"),
  );
}
const before = sourceHash();
run(
  process.execPath,
  [path.join(root, "node_modules/@tauri-apps/cli/tauri.js"), "build", ...args],
  { cwd: path.join(root, "apps/desktop"), stdio: "inherit" },
);
if (sourceHash() !== before)
  throw new Error("Source changed during build; bundle needs revalidation.");
const profile = args.includes("--debug") ? "debug" : "release";
if (process.platform === "darwin") {
  const app = path.join(root, `target/${profile}/bundle/macos/OrdiBot.app`);
  const exe = path.join(app, "Contents/MacOS/ordibot-desktop");
  if (!existsSync(exe)) throw new Error("Native OrdiBot executable missing.");
  run("/usr/bin/codesign", ["--force", "--deep", "--sign", "-", app]);
  run("/usr/bin/codesign", ["--verify", "--deep", "--strict", app]);
  const receipt = {
    product: "OrdiBot",
    identifier: "ai.ordibot.desktop",
    head: run("git", ["rev-parse", "HEAD"]).trim(),
    sourceHash: before,
    executableSha256: sha(readFileSync(exe)),
    buildTime: new Date().toISOString(),
    signature: "local-ad-hoc",
    platform: process.platform,
    arch: process.arch,
    relativeAppPath: path.relative(root, app),
  };
  const out = path.join(root, "target/ordibot-build-receipts");
  mkdirSync(out, { recursive: true });
  writeFileSync(
    path.join(out, `${receipt.executableSha256}.json`),
    JSON.stringify(receipt, null, 2),
  );
  run(
    "/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister",
    ["-f", app],
  );
  // Legacy OrdinConn bundles/frozen acceptance and private databases remain untouched.
  console.log(`Verified local OrdiBot bundle: ${receipt.relativeAppPath}`);
}

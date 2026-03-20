import { spawn } from "child_process";
import { join } from "path";
import { openSync } from "fs";

function runBackup() {
  const scriptPath = join(process.cwd(), "scripts/backup-posts.mjs");
  const logPath = join(process.cwd(), "backup.log");

  console.log(`[backup] Triggering backup script: ${scriptPath}`);

  const logFd = openSync(logPath, "a");

  const child = spawn("node", [scriptPath], {
    detached: true,
    stdio: ["ignore", logFd, logFd],
  });

  child.unref();
}

export default {
  afterCreate() {
    runBackup();
  },
  afterUpdate() {
    runBackup();
  },
};

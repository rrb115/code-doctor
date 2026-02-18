import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { logger } from "./logger.js";

export const cloneRepo = (url: string): string => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "code-doctor-repo-"));

    logger.dim(`Cloning ${url} to ${tempDir}...`);

    try {
        execSync(`git clone --depth 1 ${url} .`, {
            cwd: tempDir,
            stdio: "pipe"
        });
        return tempDir;
    } catch (error) {
        throw new Error(`Failed to clone repository: ${error instanceof Error ? error.message : String(error)}`);
    }
};

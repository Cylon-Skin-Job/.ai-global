#!/usr/bin/env node

/**
 * Launcher: Spawns background Claude instance from STATUS.md task
 *
 * Usage:
 *   node launcher.mjs --task "Phase 3 — Automated Cloud Scraper"
 *   node launcher.mjs --status-file ./STATUS.md --task "Phase 3"
 *
 * What it does:
 *   1. Parses STATUS.md for task matching --task
 *   2. Validates task is READY FOR EXECUTION
 *   3. Creates isolated git branch
 *   4. Spawns background Claude instance
 *   5. Returns immediately with instance ID
 *
 * The background instance will:
 *   - Execute task steps autonomously
 *   - Commit at each checkpoint
 *   - Update STATUS.md with progress
 *   - Merge back to main on success
 *   - Mark as BLOCKED if it fails
 */

import { spawn } from "child_process";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, resolve } from "path";
import { execSync } from "child_process";

// Parse CLI args
const args = process.argv.slice(2);
const taskIdx = args.indexOf("--task");
const taskNameArg = taskIdx >= 0 ? args[taskIdx + 1] : null;
const statusFileIdx = args.indexOf("--status-file");
const statusFileArg = statusFileIdx >= 0 ? args[statusFileIdx + 1] : null;
const projectRoot = process.cwd();

if (!taskNameArg) {
  console.error('❌ Usage: node launcher.mjs --task "Task Name"');
  process.exit(1);
}

// Resolve status file
const statusFile = statusFileArg
  ? resolve(statusFileArg)
  : join(projectRoot, ".ai-project", "bulletin", "STATUS.md");

console.log(`🚀 Launcher: Preparing to spawn background Claude`);
console.log(`   Project: ${projectRoot}`);
console.log(`   Status file: ${statusFile}`);
console.log(`   Task: "${taskNameArg}"`);

// Read and parse STATUS.md
let statusContent;
try {
  statusContent = readFileSync(statusFile, "utf-8");
} catch (err) {
  console.error(`❌ Cannot read STATUS.md: ${err.message}`);
  process.exit(1);
}

// Find task block matching taskNameArg
const taskRegex = new RegExp(
  `## TASK: ${taskNameArg}\\s*\\n(.*?)(?=## (?:TASK:|Infrastructure)|$)`,
  "s",
);
const taskMatch = statusContent.match(taskRegex);

if (!taskMatch) {
  console.error(`❌ Task not found: "${taskNameArg}"`);
  console.error(`   Available tasks in STATUS.md:`);
  const tasks = statusContent.match(/## TASK: (.+?)$/gm);
  if (tasks) {
    tasks.forEach((t) => console.error(`   - ${t.replace("## TASK: ", "")}`));
  }
  process.exit(1);
}

const taskBlock = taskMatch[0];
const taskContent = taskMatch[1];

// Validate task has READY FOR EXECUTION
if (!taskContent.includes("READY FOR EXECUTION")) {
  console.error(`❌ Task status is not READY FOR EXECUTION`);
  console.error(`   Current status: ${extractField(taskContent, "Status")}`);
  console.error(`   Update STATUS.md to READY FOR EXECUTION before launching`);
  process.exit(1);
}

// Extract task metadata
const objective = extractField(taskContent, "Objective");
const created = extractField(taskContent, "Created");
const taskId = generateTaskId();
const timestamp = new Date().toISOString();

if (!objective) {
  console.error(`❌ Task must have Objective field`);
  process.exit(1);
}

console.log(`\n✅ Task validated:`);
console.log(`   Objective: ${objective}`);
console.log(`   Created: ${created}`);
console.log(`   Instance ID: ${taskId}`);

// Ensure logs directory exists
const logsDir = join(projectRoot, ".ai-project", "logs");
mkdirSync(logsDir, { recursive: true });

// Create instance log file
const logFile = join(logsDir, `${taskId}.log`);
const instanceFile = join(logsDir, `${taskId}.instance.json`);

// Write instance metadata
const instanceMetadata = {
  taskId,
  taskName: taskNameArg,
  objective,
  projectRoot,
  startedAt: timestamp,
  pid: null,
  status: "starting",
  logFile,
};

writeFileSync(instanceFile, JSON.stringify(instanceMetadata, null, 2));

// Create isolated git branch
console.log(`\n📦 Setting up git environment...`);
try {
  const branchName = `task/${taskId}`;
  execSync(`git checkout -b ${branchName}`, {
    cwd: projectRoot,
    stdio: "pipe",
  });
  console.log(`   Branch: ${branchName}`);

  // Initial checkpoint
  execSync(
    `git commit --allow-empty -m "checkpoint: start task ${taskNameArg}"`,
    { cwd: projectRoot, stdio: "pipe" },
  );
} catch (err) {
  console.error(`⚠️  Git setup issue: ${err.message}`);
  // Continue anyway - may already be on branch
}

// Spawn background Claude executor
console.log(`\n🤖 Spawning background Claude instance...`);

const env = {
  ...process.env,
  CLAUDE_PROJECT_ROOT: projectRoot,
  CLAUDE_TASK_ID: taskId,
  CLAUDE_TASK_NAME: taskNameArg,
  CLAUDE_STATUS_FILE: statusFile,
  CLAUDE_INSTANCE_ID: taskId,
  CLAUDE_LOG_FILE: logFile,
  CLAUDE_INSTANCE_METADATA: instanceFile,
};

const executor = spawn(
  "node",
  [join(import.meta.url.replace("file://", ""), "..", "executor.mjs")],
  {
    cwd: projectRoot,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
    env,
  },
);

const pid = executor.pid;
executor.unref();

// Capture initial output
executor.stdout.on("data", (data) => {
  const line = data.toString().trim();
  if (line) {
    console.log(`   [executor] ${line}`);
    appendLog(logFile, `[stdout] ${line}`);
  }
});

executor.stderr.on("data", (data) => {
  const line = data.toString().trim();
  if (line) {
    console.error(`   [executor] ${line}`);
    appendLog(logFile, `[stderr] ${line}`);
  }
});

executor.on("close", (code) => {
  const status = code === 0 ? "✅" : "❌";
  const msg = `Executor process exited with code ${code}`;
  console.log(`${status} ${msg}`);
  appendLog(logFile, msg);

  // Update instance metadata
  instanceMetadata.status = code === 0 ? "completed" : "failed";
  instanceMetadata.endedAt = new Date().toISOString();
  writeFileSync(instanceFile, JSON.stringify(instanceMetadata, null, 2));
});

// Update instance metadata with PID
instanceMetadata.pid = pid;
instanceMetadata.status = "running";
writeFileSync(instanceFile, JSON.stringify(instanceMetadata, null, 2));

console.log(`\n✨ Background instance spawned successfully`);
console.log(`\n📋 Instance Details:`);
console.log(`   ID: ${taskId}`);
console.log(`   PID: ${pid}`);
console.log(`   Log: ${logFile}`);
console.log(`   Status: Running (detached)`);

console.log(`\n💡 While executor runs, you can:`);
console.log(`   • Start a new chat window and continue planning`);
console.log(`   • Check progress: git log --oneline | head -10`);
console.log(`   • Watch logs: tail -f ${logFile}`);
console.log(`   • See status: cat .ai-project/bulletin/STATUS.md`);

console.log(`\n✅ Launcher returning. Background Claude is autonomous now.`);

// Helper functions

function extractField(content, fieldName) {
  const regex = new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*(.+?)(?=\\n|$)`, "i");
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

function generateTaskId() {
  const now = new Date();
  const date = now.toISOString().split("T")[0].replace(/-/g, "");
  const time = now.toISOString().split("T")[1].split(".")[0].replace(/:/g, "");
  const random = Math.random().toString(36).substring(2, 8);
  return `task-${date}-${time}-${random}`;
}

function appendLog(file, message) {
  // Logging handled via stdout/stderr by executor process
  // Keep this function as no-op to avoid syntax errors
}

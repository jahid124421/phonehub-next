#!/usr/bin/env node
const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const isWindows = os.platform() === 'win32';
const tmpDir = path.join(process.cwd(), '.vercel-tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
if (!isWindows) { try { fs.chmodSync(tmpDir, 0o700); } catch (e) {} }
const LOG_FILE = path.join(tmpDir, 'login.log');
const ALLOWED_COMMANDS = new Set(['vercel']);
function log(msg) { console.error(msg); }
function commandExists(cmd) {
  if (!ALLOWED_COMMANDS.has(cmd)) throw new Error(`Command not in whitelist: ${cmd}`);
  try {
    if (isWindows) return spawnSync('where', [cmd], { stdio: 'ignore' }).status === 0;
    else return spawnSync('sh', ['-c', `command -v "$1"`, '--', cmd], { stdio: 'ignore' }).status === 0;
  } catch { return false; }
}
function getCommandOutput(cmd, args) {
  try {
    const result = spawnSync(cmd, args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], shell: isWindows });
    return result.status === 0 ? (result.stdout || '').trim() : null;
  } catch { return null; }
}
function checkVercelInstalled() {
  const vercelPath = path.join(process.cwd(), 'node_modules', '.bin', 'vercel');
  if (fs.existsSync(vercelPath) || commandExists('vercel')) {
    const version = getCommandOutput(path.join(process.cwd(), 'node_modules', '.bin', 'vercel'), ['--version']) || 'unknown';
    log(`Vercel CLI version: ${version}`);
    return true;
  }
  log('Error: Vercel CLI is not installed');
  process.exit(1);
}
function checkLoginStatus() {
  log('\nChecking login status...');
  try {
    const vercelBin = path.join(process.cwd(), 'node_modules', '.bin', 'vercel');
    const result = spawnSync(vercelBin, ['whoami'], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], shell: isWindows });
    const output = (result.stdout || '').trim();
    if (result.status === 0 && output && !output.includes('Error') && !output.includes('not logged in')) {
      log(`Logged in as: ${output}`);
      return true;
    }
  } catch {}
  return false;
}
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function startBackgroundLogin() {
  const vercelBin = path.join(process.cwd(), 'node_modules', '.bin', 'vercel');
  const logStream = fs.openSync(LOG_FILE, 'w');
  const child = spawn(vercelBin, ['login'], { detached: true, stdio: ['ignore', logStream, logStream], shell: isWindows });
  child.unref();
  log(`Background login process started (PID: ${child.pid})`);
  log(`Log file: ${LOG_FILE}`);
  const pidFile = LOG_FILE + '.pid';
  fs.writeFileSync(pidFile, String(child.pid));
  return child.pid;
}
async function waitForAuthUrl() {
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    try {
      if (fs.existsSync(LOG_FILE)) {
        const content = fs.readFileSync(LOG_FILE, 'utf8');
        const match = content.match(/https:\/\/vercel\.com\/oauth\/device\?user_code=[A-Z0-9-]+(?=\s|$)/);
        if (match) return match[0];
      }
    } catch (e) {}
  }
  return null;
}
async function doLogin() {
  log('\nStarting login authorization...\n');
  const loginPid = startBackgroundLogin();
  log('Waiting for authorization URL...');
  const authUrl = await waitForAuthUrl();
  if (authUrl) {
    log('\n========================================');
    log('Authorization URL extracted');
    log(`vercel login is running in background (PID: ${loginPid})`);
    log('========================================\n');
    console.log(JSON.stringify({ status: 'needs_auth', auth_url: authUrl, log_file: LOG_FILE }));
  } else {
    log('Failed to get authorization URL');
    try { log('Log content: ' + fs.readFileSync(LOG_FILE, 'utf8')); } catch (e) {}
    process.exit(1);
  }
}
async function main() {
  log('========================================');
  log('Vercel CLI Login Authorization');
  log('========================================\n');
  checkVercelInstalled();
  if (checkLoginStatus()) {
    log('\n========================================');
    log('Already logged in, no need to login again');
    log('========================================\n');
    console.log(JSON.stringify({ status: 'already_logged_in', message: 'Already logged in' }));
    process.exit(0);
  }
  await doLogin();
}
main();

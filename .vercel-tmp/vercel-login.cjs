#!/usr/bin/env node
const { spawnSync, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
function createSecureLogFile() {
  const tmpDir = path.join(process.cwd(), '.vercel-tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  return path.join(tmpDir, 'login.log');
}
const LOG_FILE = createSecureLogFile();
function log(msg) { console.error(msg); }
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function startBackgroundLogin() {
  const logStream = fs.openSync(LOG_FILE, 'w');
  const child = spawn('vercel', ['login'], { detached: true, stdio: ['ignore', logStream, logStream] });
  child.unref();
  log('Login PID: ' + child.pid);
  fs.writeFileSync(LOG_FILE + '.pid', String(child.pid));
  return child.pid;
}
async function waitForAuthUrl() {
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    try {
      if (fs.existsSync(LOG_FILE)) {
        const content = fs.readFileSync(LOG_FILE, 'utf8');
        const match = content.match(/https:\/\/vercel\.com\/oauth\/device\?user_code=[A-Z0-9-]+/);
        if (match) return match[0];
      }
    } catch (e) {}
  }
  return null;
}
async function main() {
  log('Starting Vercel login...');
  const pid = startBackgroundLogin();
  const authUrl = await waitForAuthUrl();
  if (authUrl) {
    log('Auth URL found: ' + authUrl);
    try { spawnSync('xdg-open', [authUrl], { stdio: 'ignore' }); } catch {}
    console.log(JSON.stringify({ status: 'needs_auth', auth_url: authUrl }));
  } else {
    log('No auth URL found. Log contents:');
    try { log(fs.readFileSync(LOG_FILE, 'utf8')); } catch (e) { log('Could not read log'); }
    process.exit(1);
  }
}
main();

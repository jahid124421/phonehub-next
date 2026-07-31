#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const isWindows = os.platform() === 'win32';
const ALLOWED_COMMANDS = new Set(['vercel', 'npm', 'pnpm', 'yarn']);
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
function parseArgs(args) {
  const result = { projectPath: '.', prod: true, yes: false, skipBuild: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--prod') result.prod = true;
    else if (arg === '--yes' || arg === '-y') result.yes = true;
    else if (arg === '--skip-build') result.skipBuild = true;
    else if (!arg.startsWith('-')) result.projectPath = arg;
  }
  return result;
}
function detectPackageManager(projectPath) {
  if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) return 'yarn';
  if (fs.existsSync(path.join(projectPath, 'package-lock.json'))) return 'npm';
  if (commandExists('npm')) return 'npm';
  return null;
}
function doDeploy(projectPath, options) {
  log('\nStarting deployment...\n');
  const vercelBin = path.join(process.cwd(), 'node_modules', '.bin', 'vercel');
  const cmdParts = [vercelBin];
  if (options.yes) cmdParts.push('--yes');
  if (options.prod) cmdParts.push('--prod');
  log(`Deployment environment: ${options.prod ? 'Production' : 'Preview'}`);
  log(`Executing: ${cmdParts.join(' ')}\n`);
  log('========================================');
  try {
    const args = cmdParts.slice(1);
    const result = spawnSync(vercelBin, args, {
      cwd: projectPath,
      encoding: 'utf8',
      stdio: ['inherit', 'pipe', 'pipe'],
      timeout: 600000,
      shell: isWindows
    });
    const output = (result.stdout || '') + (result.stderr || '');
    log(output);
    if (result.status !== 0) throw new Error('Deployment command failed');
    const aliasedMatch = output.match(/Aliased:\s*(https:\/\/[a-zA-Z0-9.-]+\.vercel\.app)/i);
    const productionUrl = aliasedMatch ? aliasedMatch[1] : null;
    const deploymentMatch = output.match(/Production:\s*(https:\/\/[a-zA-Z0-9.-]+\.vercel\.app)/i);
    const deploymentUrl = deploymentMatch ? deploymentMatch[1] : null;
    const previewMatch = output.match(/(https:\/\/[a-zA-Z0-9-]+\.vercel\.app)/);
    const previewUrl = previewMatch ? previewMatch[1] : null;
    const finalUrl = productionUrl || deploymentUrl || previewUrl;
    log('\n========================================');
    log('Deployment successful!');
    log('========================================\n');
    if (finalUrl) {
      log(`Your site is live! Visit: ${finalUrl}`);
      console.log(JSON.stringify({ status: 'success', url: finalUrl }));
    } else {
      console.log(JSON.stringify({ status: 'success', message: 'Deployment successful' }));
    }
  } catch (error) {
    log(error.message || '');
    log('\nDeployment failed');
    process.exit(1);
  }
}
function main() {
  log('========================================');
  log('Vercel CLI Project Deployment');
  log('========================================\n');
  const args = process.argv.slice(2);
  const options = parseArgs(args);
  const absPath = path.resolve(options.projectPath);
  log(`Project path: ${absPath}`);
  doDeploy(absPath, options);
}
main();

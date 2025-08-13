const { spawn } = require('child_process');
const config = require('./config.json');

// Allow override via environment variables
const xmrigPath = process.env.XMRIG_PATH || config.xmrigPath;
const pool = process.env.XMR_POOL || config.pool;
const wallet = process.env.XMR_WALLET || config.wallet;
const threads = process.env.XMR_THREADS || config.threads;

let minerProcess = null;

function startMiner() {
  if (minerProcess) return false;
  if (!xmrigPath || !pool || !wallet || !threads) {
    console.error('[XMRIG] Missing xmrigPath, pool, wallet, or threads in config or env.');
    return false;
  }
  minerProcess = spawn(xmrigPath, [
    '-o', pool,
    '-u', wallet,
    '-p', 'x',
    '--tls',
    '--threads', threads
  ]);

  minerProcess.stdout.on('data', (data) => {
    console.log(`[XMRIG] ${data}`);
  });

  minerProcess.stderr.on('data', (data) => {
    console.error(`[XMRIG ERROR] ${data}`);
  });

  minerProcess.on('close', (code) => {
    console.log(`[XMRIG] exited with code ${code}`);
    minerProcess = null;
  });

  return true;
}

function stopMiner() {
  if (!minerProcess) return false;
  minerProcess.kill('SIGINT');
  minerProcess = null;
  return true;
}

function isRunning() {
  return !!minerProcess;
}

module.exports = { startMiner, stopMiner, isRunning };

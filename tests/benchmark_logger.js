const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const ERROR_LOG_PATH = path.join(__dirname, '../data/error.log');
const AUDIT_LOG_PATH = path.join(__dirname, '../data/audit.log');

// Backup existing logs
const backupLogs = () => {
  if (fs.existsSync(ERROR_LOG_PATH)) fs.renameSync(ERROR_LOG_PATH, ERROR_LOG_PATH + '.bak');
  if (fs.existsSync(AUDIT_LOG_PATH)) fs.renameSync(AUDIT_LOG_PATH, AUDIT_LOG_PATH + '.bak');
};

const restoreLogs = () => {
  if (fs.existsSync(ERROR_LOG_PATH + '.bak')) {
    if (fs.existsSync(ERROR_LOG_PATH)) fs.unlinkSync(ERROR_LOG_PATH);
    fs.renameSync(ERROR_LOG_PATH + '.bak', ERROR_LOG_PATH);
  }
  if (fs.existsSync(AUDIT_LOG_PATH + '.bak')) {
    if (fs.existsSync(AUDIT_LOG_PATH)) fs.unlinkSync(AUDIT_LOG_PATH);
    fs.renameSync(AUDIT_LOG_PATH + '.bak', AUDIT_LOG_PATH);
  }
};

const ITERATIONS = 10000;
const MESSAGE = 'This is a test log message for benchmarking purposes.';

const runBenchmark = async () => {
  // Store original console.log
  const originalConsoleLog = console.log;
  // Mock console.log to silence output during benchmark
  console.log = () => {};

  // Restore console.log to print results
  const restoreConsoleLog = () => {
    console.log = originalConsoleLog;
  };

  try {
    backupLogs();

    restoreConsoleLog(); // Restore briefly to print start message
    console.log(`Starting benchmark with ${ITERATIONS} iterations...`);
    console.log = () => {}; // Silence again

    const start = process.hrtime();

    for (let i = 0; i < ITERATIONS; i++) {
      // Use error level to force file write
      logger.error(MESSAGE, { iteration: i });
      // Also test audit
      logger.audit(MESSAGE, { iteration: i });
    }

    const end = process.hrtime(start);
    const timeInMs = (end[0] * 1000 + end[1] / 1e6).toFixed(2);

    restoreConsoleLog();
    console.log(`Benchmark completed in ${timeInMs} ms`);
    console.log(`Average time per operation (2 writes): ${(timeInMs / ITERATIONS).toFixed(3)} ms`);

  } catch (error) {
    restoreConsoleLog();
    console.error('Benchmark failed:', error);
  } finally {
    // Clean up created logs
    if (fs.existsSync(ERROR_LOG_PATH)) fs.unlinkSync(ERROR_LOG_PATH);
    if (fs.existsSync(AUDIT_LOG_PATH)) fs.unlinkSync(AUDIT_LOG_PATH);

    restoreLogs();
    process.exit(0);
  }
};

runBenchmark();

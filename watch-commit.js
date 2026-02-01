const { execSync } = require('child_process');
const chokidar = require('chokidar');

// Simple debounce implementation
function debounce(fn, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Debounce commits to avoid multiple rapid commits
const debouncedCommit = debounce(() => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    execSync('git add -A', { cwd: __dirname });
    execSync(`git commit -m "auto: ${timestamp}"`, { cwd: __dirname });
    execSync('git push', { cwd: __dirname });
    console.log(`✓ Committed and pushed: ${timestamp}`);
  } catch (e) {
    // Nothing to commit or git error
  }
}, 3000); // Wait 3 seconds after last change before committing

// Watch all theme files
const watcher = chokidar.watch('.', {
  cwd: __dirname,
  ignored: [
    '.git/**',
    'node_modules/**',
    '.shopify/**',
    '*.bak'
  ],
  persistent: true
});

watcher.on('change', debouncedCommit);
watcher.on('add', debouncedCommit);

console.log('👀 Watching for changes... (Ctrl+C to stop)');

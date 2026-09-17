// Verifies that the committed dist/ matches a fresh build.
//
// A plain `git diff -- dist/` is not enough: it only sees *tracked* files that
// changed. It would miss a newly emitted artifact that nobody committed (git
// reports those as untracked, which `git diff` ignores) and it would miss a
// committed artifact the build no longer emits, because rspack writes into
// dist/ without clearing it first, so the stale file simply survives untouched.
//
// So the directory is removed up front and rebuilt from scratch, then
// `git status --porcelain` is used, which reports modified, deleted AND
// untracked paths. Deleting once before the build (rather than using rspack's
// `output.clean`) also avoids the three parallel compilers wiping each other's
// output.
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { cwd: repoRoot, encoding: 'utf8', ...opts });

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

console.log('Removing dist/ and rebuilding from scratch...');
rmSync(join(repoRoot, 'dist'), { recursive: true, force: true });
run(npm, ['run', 'build'], { stdio: 'inherit' });

const status = run('git', ['status', '--porcelain', '--', 'dist/']).trim();

if (status) {
  console.error('\nERROR: committed dist/ does not match a fresh build.\n');
  console.error(status);
  console.error(
    '\nEach line is a drifted path (M = changed, D = no longer emitted, ?? = new and uncommitted).',
  );
  console.error("Run 'npm run build' and commit the resulting dist/ changes.\n");
  // Leave the rebuilt tree in place so the diff can be inspected.
  process.exit(1);
}

console.log('\ndist/ is up to date with a clean rebuild.');

// Smoke-tests the *packed* package exactly as a consumer receives it.
//
// This exists because nothing else covers the published layout. The unit suite
// imports `lib/index` directly and the browser suite loads the global bundle,
// so a broken `exports` map, a missing ESM bundle or a wrong `types` path would
// pass every other check. That is not hypothetical: 2.0.0 shipped with
// `require('easyepoch')` returning `{}` and no test caught it.
//
// npm pack -> install the tarball into a throwaway project -> assert every
// documented consumption path resolves and yields the class.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const pkg = JSON.parse(
  execFileSync(npm, ['pkg', 'get', 'name', 'version'], { cwd: repoRoot, encoding: 'utf8' }),
);
const tarball = `${pkg.name}-${pkg.version}.tgz`;

const work = mkdtempSync(join(tmpdir(), 'easyepoch-verify-'));
let failures = 0;

const check = (label, fn) => {
  try {
    const detail = fn();
    console.log(`  PASS  ${label}${detail ? ` (${detail})` : ''}`);
  } catch (err) {
    failures++;
    console.error(`  FAIL  ${label}`);
    console.error(`        ${String(err.message || err).split('\n').slice(0, 4).join('\n        ')}`);
  }
};

try {
  console.log(`Packing ${pkg.name}@${pkg.version}...`);
  execFileSync(npm, ['pack', '--pack-destination', work], { cwd: repoRoot, stdio: 'inherit' });

  const tarballPath = join(work, tarball);
  if (!existsSync(tarballPath)) throw new Error(`npm pack did not produce ${tarball}`);

  console.log('Installing the tarball into a throwaway project...');
  execFileSync(npm, ['init', '-y'], { cwd: work, stdio: 'ignore' });
  execFileSync(npm, ['install', tarballPath], { cwd: work, stdio: 'inherit' });

  const node = (code, ext = 'cjs') => {
    const file = join(work, `probe.${ext}`);
    writeFileSync(file, code);
    return execFileSync(process.execPath, [file], { cwd: work, encoding: 'utf8' }).trim();
  };

  console.log('\nVerifying the published layout:');

  check('CommonJS  require("easyepoch") is the class', () => {
    const out = node(`
      const E = require('easyepoch');
      if (typeof E !== 'function') throw new Error('expected a class, got ' + typeof E);
      if (typeof E.prototype.destroy !== 'function') throw new Error('missing destroy()');
      if (typeof E.linkRange !== 'function') throw new Error('missing static linkRange()');
      console.log(require.resolve('easyepoch').split(/[\\\\/]/).pop());
    `);
    return out;
  });

  check('ESM       import resolves to the .mjs bundle', () => {
    const out = node(
      `
      import E from 'easyepoch';
      if (typeof E !== 'function') throw new Error('expected a class, got ' + typeof E);
      if (typeof E.prototype.destroy !== 'function') throw new Error('missing destroy()');
      const file = import.meta.resolve('easyepoch').split('/').pop();
      if (!file.endsWith('.mjs')) throw new Error('import condition resolved to ' + file);
      console.log(file);
    `,
      'mjs',
    );
    return out;
  });

  check('Subpath   "easyepoch/css" resolves', () =>
    node(`console.log(require.resolve('easyepoch/css').split(/[\\\\/]/).pop());`));

  check('Declared  types files referenced by exports exist', () => {
    const installed = join(work, 'node_modules', 'easyepoch');
    const manifest = JSON.parse(
      execFileSync(process.execPath, ['-p', `JSON.stringify(require(${JSON.stringify(join(installed, 'package.json'))}))`], { encoding: 'utf8' }),
    );
    const paths = [
      manifest.exports['.'].import.types,
      manifest.exports['.'].require.types,
      manifest.types,
    ];
    for (const p of paths) {
      if (!existsSync(join(installed, p))) throw new Error(`missing ${p}`);
    }
    return paths.join(', ');
  });

  // TypeScript must accept both documented import forms against the packed
  // layout, under a modern resolver that actually honours `exports`.
  const tsc = join(repoRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc');
  // `moduleResolution: bundler` is only valid alongside an ESM `module`
  // setting, so the two flags are not interchangeable.
  const MODULE_FOR = { node16: 'node16', bundler: 'esnext' };
  const typecheck = (label, source, resolution) =>
    check(label, () => {
      const file = join(work, `ts-${resolution}-${Math.random().toString(36).slice(2, 8)}.ts`);
      writeFileSync(file, source);
      execFileSync(
        tsc,
        ['--noEmit', '--strict', '--target', 'es2020', '--module', MODULE_FOR[resolution],
          '--moduleResolution', resolution, '--esModuleInterop', '--skipLibCheck', file],
        { cwd: work, encoding: 'utf8' },
      );
      return `moduleResolution=${resolution}`;
    });

  typecheck(
    'Types     default import typechecks',
    'import EasyEpoch from "easyepoch";\nconst p: EasyEpoch = new EasyEpoch({ theme: "dark" });\np.destroy();\nEasyEpoch.linkRange(p, p);\n',
    'node16',
  );
  typecheck(
    'Types     default import typechecks',
    'import EasyEpoch from "easyepoch";\nconst p: EasyEpoch = new EasyEpoch();\np.destroy();\n',
    'bundler',
  );
  typecheck(
    'Types     import = require typechecks',
    'import EasyEpoch = require("easyepoch");\nconst p = new EasyEpoch();\np.destroy();\n',
    'node16',
  );

  check('Hygiene   no pre-fork simplepicker artifacts are published', () => {
    const files = execFileSync('tar', ['-tzf', tarballPath], { encoding: 'utf8' });
    const legacy = files.split('\n').filter((f) => f.includes('simplepicker'));
    if (legacy.length) throw new Error(`found ${legacy.length}: ${legacy.join(', ')}`);
    return 'none';
  });
} finally {
  rmSync(work, { recursive: true, force: true });
}

if (failures) {
  console.error(`\n${failures} packaging check(s) failed.`);
  process.exit(1);
}
console.log('\nPacked package is consumable from every documented entry point.');

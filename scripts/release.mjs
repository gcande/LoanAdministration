import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const validBumps = new Set(['patch', 'minor', 'major']);
const bump = process.argv[2];

if (!validBumps.has(bump)) {
  console.error('Uso: node scripts/release.mjs <patch|minor|major>');
  process.exit(1);
}

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

function readVersion() {
  const pkgPath = path.join(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return pkg.version;
}

const oldVersion = readVersion();
console.log(`Version actual: v${oldVersion}`);

run('npm run build');
run(`npm version ${bump} --no-git-tag-version`);

const newVersion = readVersion();
console.log(`Nueva version: v${newVersion}`);

run(`node scripts/update-changelog.mjs ${newVersion}`);
run('git add package.json package-lock.json CHANGELOG.md');
run(`git commit -m "chore(release): v${newVersion}"`);
run(`git tag v${newVersion}`);

console.log('\nRelease local creado.');
console.log('Siguiente paso: git push && git push --tags');

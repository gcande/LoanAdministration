import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const changelogPath = path.join(root, 'CHANGELOG.md');
const pkgPath = path.join(root, 'package.json');

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function readVersion() {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return pkg.version;
}

function getLastTag() {
  return run('git tag --list "v*" --sort=-version:refname').split('\n').filter(Boolean)[0] || '';
}

function getCommitSubjects(range) {
  const cmd = range
    ? `git log --pretty=format:%s ${range}`
    : 'git log --pretty=format:%s';
  return run(cmd).split('\n').map((s) => s.trim()).filter(Boolean);
}

function groupCommits(subjects) {
  const groups = {
    Features: [],
    Fixes: [],
    Refactors: [],
    Docs: [],
    Chores: [],
    Other: []
  };

  for (const subject of subjects) {
    if (subject.startsWith('feat')) groups.Features.push(subject);
    else if (subject.startsWith('fix')) groups.Fixes.push(subject);
    else if (subject.startsWith('refactor')) groups.Refactors.push(subject);
    else if (subject.startsWith('docs')) groups.Docs.push(subject);
    else if (subject.startsWith('chore') || subject.startsWith('ci') || subject.startsWith('build')) groups.Chores.push(subject);
    else groups.Other.push(subject);
  }

  return groups;
}

function renderSection(version, groups) {
  const date = new Date().toISOString().slice(0, 10);
  const lines = [`## v${version} - ${date}`, ''];

  for (const [name, items] of Object.entries(groups)) {
    if (!items.length) continue;
    lines.push(`### ${name}`);
    for (const item of items) {
      lines.push(`- ${item}`);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd() + '\n';
}

function ensureChangelogExists() {
  if (!fs.existsSync(changelogPath)) {
    fs.writeFileSync(changelogPath, '# Changelog\n\n', 'utf8');
  }
}

function prependSection(section) {
  const existing = fs.readFileSync(changelogPath, 'utf8');
  const header = '# Changelog\n\n';

  if (existing.startsWith(header)) {
    const rest = existing.slice(header.length).trimStart();
    fs.writeFileSync(changelogPath, `${header}${section}\n${rest}`.trimEnd() + '\n', 'utf8');
    return;
  }

  fs.writeFileSync(changelogPath, `${header}${section}\n${existing}`.trimEnd() + '\n', 'utf8');
}

const argVersion = process.argv[2];
const version = argVersion || readVersion();
const lastTag = getLastTag();
const range = lastTag ? `${lastTag}..HEAD` : '';
const subjects = getCommitSubjects(range);

if (!subjects.length) {
  console.log('No hay commits nuevos para agregar al changelog.');
  process.exit(0);
}

ensureChangelogExists();
const groups = groupCommits(subjects);
const section = renderSection(version, groups);
prependSection(section);

console.log(`CHANGELOG actualizado para v${version}${lastTag ? ` (desde ${lastTag})` : ''}.`);

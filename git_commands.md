# Git Commands Log — sumisongs

This file records every Git command used in this project for learning and debugging.

---

## Setup

### Initialize git repository
```bash
git init
```
Initializes a new Git repo in the current directory. Creates a hidden `.git/` folder that tracks all changes.

### Add remote origin (GitHub)
```bash
git remote add origin https://github.com/sumithnalla/sumisongs.git
```
Links your local repo to the GitHub repo so you can push/pull.

### Verify remote is set
```bash
git remote -v
```
Shows the fetch and push URLs for all remotes. Useful to confirm the remote was added correctly.

---

## Commit 1 — Initial project (Phases 1-3 complete)

### Check what's changed / untracked
```bash
git status
```
Shows which files are modified, new, or staged. "Untracked" = new files Git doesn't know about yet. "Modified" = changed since last commit.

### Stage all files
```bash
git add .
```
Stages ALL files in the current directory (and subdirectories). Files must be staged before they can be committed. `.gitignore` controls what gets excluded.

### Commit with a message
```bash
git commit -m "feat: Phases 1-3 complete — backend, frontend, local storage fallback"
```
Saves the staged snapshot permanently with a descriptive message. Convention: `feat:` for new features, `fix:` for bug fixes, `chore:` for maintenance.

### Push to GitHub (first time)
```bash
git push -u origin main
```
Pushes commits to GitHub. `-u` sets `origin main` as the default so future pushes can just use `git push`.

---

## Commit 2 — GridFS storage provider added

### Stage all changes
```bash
git add .
```

### Commit
```bash
git commit -m "feat: add GridFS storage provider, storage abstraction layer, reseed songs to GridFS"
```

### Push
```bash
git push
```
(Shorthand after `-u` is set in previous push)

---

## Useful Git Commands Reference

### See commit history
```bash
git log --oneline
```
Shows a compact list of all commits (hash + message). Most recent at top.

### See what changed in last commit
```bash
git show HEAD --stat
```
Shows which files were added/modified in the last commit.

### See diff of unstaged changes
```bash
git diff
```
Shows line-by-line changes not yet staged.

### See diff of staged changes
```bash
git diff --staged
```
Shows what's staged and about to be committed.

### Undo last commit (keep changes)
```bash
git reset --soft HEAD~1
```
"Uncommits" the last commit but keeps your files. Safe for fixing commit messages.

### Discard changes to a file
```bash
git checkout -- <filename>
```
WARNING: This permanently discards local changes to that file.

### Create a new branch
```bash
git checkout -b feature/my-feature
```
Creates and switches to a new branch. Use branches to work on features without affecting `main`.

### Switch branches
```bash
git checkout main
```

### Merge a branch into main
```bash
git checkout main
git merge feature/my-feature
```

### Pull latest from GitHub
```bash
git pull origin main
```
Downloads and merges the latest changes from GitHub.

### See all branches
```bash
git branch -a
```
`-a` shows local AND remote branches.

### Tag a release
```bash
git tag -a v1.0.0 -m "Phase 3 complete"
git push origin v1.0.0
```
Tags mark important points in history (like releases).

---

## .gitignore Notes

The `.gitignore` file tells Git which files to NEVER track.
Key exclusions in this project:
- `backend/.venv/` — Python virtual environment (huge, recreatable)
- `backend/.env` — Contains secrets! NEVER commit this.
- `node_modules/` — Frontend dependencies (huge, recreatable)
- `__pycache__/` — Python bytecode cache
- `*.pyc` — Compiled Python files
- `.pytest_cache/` — Test cache
- `dist/` — Frontend build output

---

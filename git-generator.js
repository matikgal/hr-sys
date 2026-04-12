const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function execGit(cmd, env = {}) {
  try {
    return execSync(cmd, { 
      stdio: 'pipe', 
      env: { 
        ...process.env, 
        GIT_AUTHOR_NAME: "Developer", 
        GIT_AUTHOR_EMAIL: "dev@example.com", 
        GIT_COMMITTER_NAME: "Developer", 
        GIT_COMMITTER_EMAIL: "dev@example.com",
        ...env 
      } 
    }).toString();
  } catch(e) {
    return null;
  }
}

console.log("[1/6] Preparing repository...");
const isGit = execGit('git rev-parse --is-inside-work-tree');
if (isGit) {
  execGit('git rm -r --cached .');
} else {
  execGit('git init');
}

console.log("[2/6] Fetching files...");
function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const basename = path.basename(filePath);
    if (['node_modules', '.next', '.git', 'git-generator.js', 'dist', 'build'].includes(basename)) {
      continue;
    }
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allFiles = getFiles(process.cwd());

// Shuffle files
for (let i = allFiles.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [allFiles[i], allFiles[j]] = [allFiles[j], allFiles[i]];
}

console.log(`[2/6] Found ${allFiles.length} files.`);

console.log("[3/6] Generating timeline...");
const now = Date.now();
const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;
const dates = [];
for (let i = 0; i < 70; i++) {
  dates.push(new Date(fourteenDaysAgo + Math.random() * (now - fourteenDaysAgo)));
}
dates.sort((a, b) => a - b);

console.log("[4/6] Creating message pool...");
const messages = [
  "Refactor UI components", "Update API types", "Fix layout shift", "Integrate database service", 
  "Add error handling", "Improve performance of list rendering", "Fix authentication bug", 
  "Update dependencies", "Add unit tests for utils", "Refactor state management", 
  "Update styles for dark mode", "Add new feature flag", "Optimize image loading",
  "Fix typo in README", "Add CI/CD workflow", "Refactor routing logic", 
  "Improve accessibility", "Add internationalization support", "Fix memory leak in hooks", 
  "Update API endpoints", "Add pagination support", "Refactor data fetching", 
  "Improve error boundaries", "Update form validation", "Add analytics tracking", 
  "Refactor layout structure", "Fix mobile responsiveness", "Add missing documentation",
  "Update configuration files", "Fix edge cases in data parsing", "Optimize database indexing", 
  "Add rate limiting", "Refactor database models"
];

console.log("[5/6] Committing changes in 70 steps...");
const chunks = Array.from({ length: 70 }, () => []);
allFiles.forEach((f, i) => {
  chunks[i % 70].push(f);
});

for (let i = 0; i < 70; i++) {
  const dateStr = dates[i].toISOString();
  let added = false;
  for(const file of chunks[i]) {
    try {
      execSync(`git add "${file}"`, { stdio: 'ignore' });
      added = true;
    } catch(e) {}
  }
  
  if (added) {
    const msg = messages[Math.floor(Math.random() * messages.length)];
    execGit(`git commit -m "${msg}"`, { GIT_AUTHOR_DATE: dateStr, GIT_COMMITTER_DATE: dateStr });
  }
}

console.log("[6/6] Finalization...");
try {
  execSync('git add .', { stdio: 'ignore' });
  execGit(`git commit -m "Final adjustments"`, { 
    GIT_AUTHOR_DATE: new Date().toISOString(), 
    GIT_COMMITTER_DATE: new Date().toISOString() 
  });
} catch(e) {}

console.log("Git history generated successfully!");

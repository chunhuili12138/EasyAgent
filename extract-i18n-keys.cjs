const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const keys = new Set();

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.vue') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      // Match $t('key') or $t("key") or t('key') or t("key")
      const regex = /\$?t\(['"]([^'"]+)['"]/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        keys.add(match[1]);
      }
    }
  }
}

walk(srcDir);
console.log(JSON.stringify(Array.from(keys).sort(), null, 2));
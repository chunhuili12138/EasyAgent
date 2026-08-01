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
      // Use a more comprehensive regex to catch all variations
      const regex = /\$?t\(['"]([^'"]+)['"]/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        keys.add(match[1]);
      }
    }
  }
}

walk(srcDir);

// Save to file
fs.writeFileSync(path.join(__dirname, 'used-keys.txt'), Array.from(keys).sort().join('\n'));
console.log('Total unique i18n keys used in codebase:', keys.size);
console.log('Saved to used-keys.txt');
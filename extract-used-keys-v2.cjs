const fs = require('node:fs');
const path = require('node:path');

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
      // Match $t('key.path') or $t("key.path") or t('key.path') or t("key.path")
      // But only capture patterns that look like i18n keys (contain dots or are known keys)
      const regex = /\$?t\(['"]([a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+)['"]/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        keys.add(match[1]);
      }
    }
  }
}

walk(srcDir);

// Save to file
const sortedKeys = Array.from(keys).sort();
fs.writeFileSync(path.join(__dirname, 'used-keys.txt'), sortedKeys.join('\n'));
console.log('Total unique i18n keys used in codebase:', keys.size);
console.log('Saved to used-keys.txt');

// Print first 50 to verify
console.log('\nFirst 50 keys:');
sortedKeys.slice(0, 50).forEach(k => console.log(k));

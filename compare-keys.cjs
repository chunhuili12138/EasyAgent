const fs = require('node:fs');
const path = require('node:path');

// Parse locale file to extract the object
function parseLocaleFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Match const local = { ... } or const local: App.I18n.Schema = { ... }
  const match = content.match(/const local[^=]*= ({[\s\S]*?});/);
  if (!match) {
    throw new Error(`Could not parse locale file: ${filePath}`);
  }
  // Use eval to parse the object (safe since we control the file)
  const obj = eval(`(${match[1]})`);
  return obj;
}

function flatten(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...flatten(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const zhCNPath = path.join(__dirname, 'src', 'locales', 'langs', 'zh-cn.ts');
const enUSPath = path.join(__dirname, 'src', 'locales', 'langs', 'en-us.ts');

const zhCNObj = parseLocaleFile(zhCNPath);
const enUSObj = parseLocaleFile(enUSPath);

const zhCNKeys = flatten(zhCNObj);
const enUSKeys = flatten(enUSObj);

console.log('zh-CN keys:', zhCNKeys.length);
console.log('en-US keys:', enUSKeys.length);

// Load used keys
const usedKeys = fs
  .readFileSync(path.join(__dirname, 'used-keys.txt'), 'utf8')
  .split('\n')
  .filter(Boolean)
  .map(k => k.trim());

console.log('\nUsed keys:', usedKeys.length);

// Find missing in zh-CN
const missingInZhCN = usedKeys.filter(k => !zhCNKeys.includes(k));
console.log('\n=== Keys USED in code but MISSING in zh-CN ===');
if (missingInZhCN.length === 0) {
  console.log('(none)');
} else {
  missingInZhCN.forEach(k => console.log(k));
}

// Find missing in en-US
const missingInEnUS = usedKeys.filter(k => !enUSKeys.includes(k));
console.log('\n=== Keys USED in code but MISSING in en-US ===');
if (missingInEnUS.length === 0) {
  console.log('(none)');
} else {
  missingInEnUS.forEach(k => console.log(k));
}

// Find unused in zh-CN
const unusedInZhCN = zhCNKeys.filter(k => !usedKeys.includes(k));
console.log('\n=== Keys in zh-CN but NOT USED in code ===');
console.log(`Total: ${unusedInZhCN.length}`);

// Find unused in en-US
const unusedInEnUS = enUSKeys.filter(k => !usedKeys.includes(k));
console.log('\n=== Keys in en-US but NOT USED in code ===');
console.log(`Total: ${unusedInEnUS.length}`);

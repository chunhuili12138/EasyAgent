const fs = require('fs');
const path = require('path');

function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Read and parse zh-cn.ts
const zhCNPath = path.join(__dirname, 'src', 'locales', 'langs', 'zh-cn.ts');
const zhCNContent = fs.readFileSync(zhCNPath, 'utf8');

// Extract the object from the const local = { ... } export
const zhCNMatch = zhCNContent.match(/const local = ({[\s\S]*?});/);
if (!zhCNMatch) {
  console.error('Could not find zh-CN locale object');
  process.exit(1);
}
const zhCNObj = eval('(' + zhCNMatch[1] + ')');
const zhCNKeys = flattenKeys(zhCNObj);

// Read and parse en-us.ts
const enUSPath = path.join(__dirname, 'src', 'locales', 'langs', 'en-us.ts');
const enUSContent = fs.readFileSync(enUSPath, 'utf8');
const enUSMatch = enUSContent.match(/const local: App.I18n.Schema = ({[\s\S]*?});/);
if (!enUSMatch) {
  console.error('Could not find en-US locale object');
  process.exit(1);
}
const enUSObj = eval('(' + enUSMatch[1] + ')');
const enUSKeys = flattenKeys(enUSObj);

console.log('=== ZH-CN Keys Count:', zhCNKeys.length);
console.log('=== EN-US Keys Count:', enUSKeys.length);

// Find keys in codebase that are not in locale files
const codeKeys = new Set([
  // These were extracted from the previous step, let's include them manually
  // Actually let's just use the Set directly
]);

// Compare
const zhCNKeySet = new Set(zhCNKeys);
const enUSKeySet = new Set(enUSKeys);

console.log('\n=== Keys in zh-CN but not in en-US ===');
for (const key of zhCNKeys) {
  if (!enUSKeySet.has(key)) {
    console.log(key);
  }
}

console.log('\n=== Keys in en-US but not in zh-CN ===');
for (const key of enUSKeys) {
  if (!zhCNKeySet.has(key)) {
    console.log(key);
  }
}

console.log('\n=== Keys that exist in both ===');
let bothCount = 0;
for (const key of zhCNKeys) {
  if (enUSKeySet.has(key)) bothCount++;
}
console.log(`Count: ${bothCount}`);
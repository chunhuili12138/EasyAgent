const fs = require('fs');
const path = require('path');

// Parse locale file to extract the object
function parseLocaleFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/const local[^=]*= ({[\s\S]*?});/);
  if (!match) {
    throw new Error(`Could not parse locale file: ${filePath}`);
  }
  const obj = eval('(' + match[1] + ')');
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

const zhCNKeys = new Set(flatten(zhCNObj));
const enUSKeys = new Set(flatten(enUSObj));

// All dynamic keys from constants/app.ts
const dynamicKeys = [
  // themeSchemaRecord
  'theme.themeSchema.light',
  'theme.themeSchema.dark',
  'theme.themeSchema.auto',
  // loginModuleRecord
  'page.login.pwdLogin.title',
  'page.login.codeLogin.title',
  'page.login.register.title',
  'page.login.resetPwd.title',
  'page.login.bindWeChat.title',
  // themeLayoutModeRecord
  'theme.layoutMode.vertical',
  'theme.layoutMode.vertical-mix',
  'theme.layoutMode.horizontal',
  'theme.layoutMode.horizontal-mix',
  // themeScrollModeRecord
  'theme.scrollMode.wrapper',
  'theme.scrollMode.content',
  // themeTabModeRecord
  'theme.tab.mode.chrome',
  'theme.tab.mode.button',
  // themePageAnimationModeRecord
  'theme.page.mode.fade-slide',
  'theme.page.mode.fade',
  'theme.page.mode.fade-bottom',
  'theme.page.mode.fade-scale',
  'theme.page.mode.zoom-fade',
  'theme.page.mode.zoom-out',
  'theme.page.mode.none',
];

// ACL_MODES from constants/document
const aclModesKeys = [
  'page.manage.process.aclMode.global',
  'page.manage.process.aclMode.department',
  'page.manage.process.aclMode.post',
  'page.manage.process.aclMode.user'
];

// DOC_TYPES
const docTypesKeys = [
  'page.manage.parse.fileType.document',
  'page.manage.parse.fileType.spreadsheet',
  'page.manage.parse.fileType.presentation',
  'page.manage.parse.fileType.code',
  'page.manage.parse.fileType.image',
  'page.manage.parse.fileType.video',
  'page.manage.parse.fileType.audio',
  'page.manage.parse.fileType.archive',
  'page.manage.parse.fileType.other'
];

// Check all dynamic keys
const allDynamicKeys = [...dynamicKeys, ...aclModesKeys, ...docTypesKeys];

console.log('=== Checking dynamic i18n keys ===\n');

let missingInZhCN = 0;
let missingInEnUS = 0;

for (const key of allDynamicKeys) {
  const inZhCN = zhCNKeys.has(key);
  const inEnUS = enUSKeys.has(key);
  if (!inZhCN || !inEnUS) {
    console.log(`Key: ${key}`);
    if (!inZhCN) {
      console.log(`  MISSING in zh-CN`);
      missingInZhCN++;
    }
    if (!inEnUS) {
      console.log(`  MISSING in en-US`);
      missingInEnUS++;
    }
  }
}

console.log(`\nTotal dynamic keys checked: ${allDynamicKeys.length}`);
console.log(`Missing in zh-CN: ${missingInZhCN}`);
console.log(`Missing in en-US: ${missingInEnUS}`);

// Also check parseStatusMap and processStatusMap from document/parse/index.vue
// and the search result i18nKey
const searchKeys = [
  'common.noData',
  // from search-result.vue and search-modal.vue
  'system.menu', 'system.role', 'system.department', 'system.post', 'system.dict',
  'system.tenant', 'system.user', 'system.message', 'system.log',
  'document.file', 'document.kb', 'document.parse', 'document.process',
  'rag.skill', 'rag.datasource', 'rag.tool', 'rag.experience', 'rag.sql-log',
  'rag.bad-case', 'rag.audit', 'rag.chat'
];

console.log('\n=== Checking search/routing i18n keys ===');
for (const key of searchKeys) {
  const inZhCN = zhCNKeys.has(key);
  const inEnUS = enUSKeys.has(key);
  if (!inZhCN || !inEnUS) {
    console.log(`Key: ${key} - zh-CN: ${inZhCN ? 'OK' : 'MISSING'}, en-US: ${inEnUS ? 'OK' : 'MISSING'}`);
  }
}
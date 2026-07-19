/*
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │   mip-lang — custom languages for MIP                              │
 * │   Create, package, and apply language packs                       │
 * └─────────────────────────────────────────────────────────────────────┘
 */

const fs = require('fs');
const path = require('path');

// ==========================================
// PATHS
// ==========================================

function getPluginDir() {
  // Локальные файлы mip-plugins размещены в репозитории, поэтому привязываемся к __dirname.
  return path.join(__dirname, 'locales').includes('locales')
    ? path.join(__dirname, '..')
    : path.join(__dirname);
}

function getLocalesDir() {
  return path.join(__dirname, 'locales');
}

function getTemplatesDir() {
  return path.join(__dirname, 'templates');
}

function getCustomLangPath(lang) {
  return path.join(getLocalesDir(), `${lang}.json`);
}

function getTemplatePath(lang) {
  return path.join(getTemplatesDir(), `${lang}.json`);
}


function getMipYmlPath() {
  return path.join(process.cwd(), 'mip.yml');
}

function getMipJsonPath() {
  return path.join(process.cwd(), 'mip.json');
}

function getProjectMipLangLocalesDir() {
  return path.join(process.cwd(), 'plugins', 'mip-lang', 'locales');
}

function getPluginBaseDir() {
  // папка builtin mip-lang в проекте (cwd/plugins/mip-lang) или fallback на репо
  return path.join(process.cwd(), 'plugins', 'mip-lang');
}






// ==========================================
// HELPERS
// ==========================================

function ensureDirs() {
  const dirs = [getLocalesDir(), getTemplatesDir()];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

function getAvailableTemplates() {
  const templatesDir = getTemplatesDir();
  if (!fs.existsSync(templatesDir)) return [];
  return fs.readdirSync(templatesDir)
    .filter(f => f.endsWith('.json'))
    .map(f => path.basename(f, '.json'));
}

function getAvailableCustomLangs() {
  const localesDir = getLocalesDir();
  if (!fs.existsSync(localesDir)) return [];
  return fs.readdirSync(localesDir)
    .filter(f => f.endsWith('.json'))
    .map(f => path.basename(f, '.json'));
}

function readConfig() {
  // Приоритет: mip.yml
  const ymlPath = getMipYmlPath();
  if (fs.existsSync(ymlPath)) {
    try {
      const yaml = require('js-yaml');
      return yaml.load(fs.readFileSync(ymlPath, 'utf8'));
    } catch {}
  }

  // fallback: mip.json
  const jsonPath = getMipJsonPath();
  if (fs.existsSync(jsonPath)) {
    try {
      return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch {}
  }

  // fallback: package.json
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    } catch {}
  }

  return null;
}

function writeConfig(config) {
  // Пишем в mip.yml (основной формат)
  const ymlPath = getMipYmlPath();
  const yaml = require('js-yaml');
  // гарантируем, что директория существует (на практике это cwd)
  fs.mkdirSync(path.dirname(ymlPath), { recursive: true });
  fs.writeFileSync(ymlPath, yaml.dump(config, { indent: 2 }));
  console.log(`   Updated mip.yml`);
}



// ==========================================
// COMMANDS
// ==========================================

async function create(args) {
  const langName = args[0];
  const templateLang = args[1] || 'en';

  if (!langName) {
    console.log('Usage: mip pe mip-lang create <language_name> [template_language]');
    console.log('Example: mip pe mip-lang create pirate en');
    return;
  }

  ensureDirs();

  const templatePath = getTemplatePath(templateLang);
  if (!fs.existsSync(templatePath)) {
    console.log(`❌ Template language "${templateLang}" not found`);
    console.log(`Available templates: ${getAvailableTemplates().join(', ')}`);
    return;
  }

  const targetPath = getCustomLangPath(langName);
  if (fs.existsSync(targetPath)) {
    console.log(`❌ Language "${langName}" already exists`);
    return;
  }

  const templateContent = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  fs.writeFileSync(targetPath, JSON.stringify(templateContent, null, 2));
  
  console.log(`✅ Created language "${langName}" from template "${templateLang}"`);
  console.log(`   File: ${targetPath}`);
  console.log(`   Edit this file to customize translations`);
}

async function pack(args) {
  const langName = args[0];

  if (!langName) {
    console.log('Usage: mip pe mip-lang pack <language_name>');
    console.log('Example: mip pe mip-lang pack pirate');
    return;
  }

  const langPath = getCustomLangPath(langName);
  if (!fs.existsSync(langPath)) {
    console.log(`❌ Language "${langName}" not found`);
    console.log(`Available languages: ${getAvailableCustomLangs().join(', ')}`);
    return;
  }

  const pluginName = `mip-lang-${langName}`;
  const pluginDir = path.join(process.cwd(), 'plugins', pluginName);
  if (fs.existsSync(pluginDir)) {
    console.log(`❌ Plugin "${pluginName}" already exists`);
    return;
  }

  fs.mkdirSync(pluginDir, { recursive: true });

  const localesDir = path.join(pluginDir, 'locales');
  fs.mkdirSync(localesDir, { recursive: true });
  fs.copyFileSync(langPath, path.join(localesDir, `${langName}.json`));

  const pkg = {
    name: pluginName,
    version: '1.0.0',
    description: `MIP language pack: ${langName}`,
    main: 'index.js',
    peerDependencies: {
      mip: '>=2.0.0'
    },
    keywords: ['mip', 'language', 'i18n', langName],
    license: 'MIT'
  };
  fs.writeFileSync(path.join(pluginDir, 'package.json'), JSON.stringify(pkg, null, 2));

  const indexContent = `
// Language pack: ${langName}
// Auto-generated by mip-lang

module.exports = {
  name: '${pluginName}',
  version: '1.0.0',
  description: 'MIP language pack: ${langName}',
  
  init: async ({ api }) => {
    console.log('[${pluginName}] 🌍 Language pack loaded!');
    console.log('[${pluginName}] Use: mip language ${langName}');
  }
};
`;
  fs.writeFileSync(path.join(pluginDir, 'index.js'), indexContent.trim());

  console.log(`✅ Packaged "${langName}" into plugin "${pluginName}"`);
  console.log(`   Location: ${pluginDir}`);
  console.log(`   To install: mip plugin compile ${pluginName}`);
  console.log(`   To activate: mip plugin activate ${pluginName}`);
  console.log(`   To use: mip language ${langName}`);
}

async function apply(args) {
  const langName = args[0];

  if (!langName) {
    console.log('Usage: mip pe mip-lang apply <language_name>');
    console.log('Example: mip pe mip-lang apply pirate');
    return;
  }

  // 1) Убедимся, что файл локали существует в той точке, которую читает lib/i18n/index.js:
  //    plugins/<any-plugin>/locales/<lang>.json
  // Встроенный mip-lang хранит локали в plugins/mip-lang/locales, поэтому поддержим:
  //  - plugins/mip-lang/locales/<lang>.json (проще всего)
  ensureDirs();

  const builtinLocalesPath = path.join(getProjectMipLangLocalesDir(), `${langName}.json`);

  // если в проекте еще нет cwd/plugins/mip-lang — используем builtin mip-lang из репозитория
  if (!fs.existsSync(path.dirname(builtinLocalesPath))) {
    const repoLocalesPath = path.join(__dirname, 'locales');
    const repoLangPath = path.join(repoLocalesPath, `${langName}.json`);
    if (fs.existsSync(repoLangPath)) {
      fs.mkdirSync(path.dirname(builtinLocalesPath), { recursive: true });
      fs.copyFileSync(repoLangPath, builtinLocalesPath);
    }
  }

  if (!fs.existsSync(builtinLocalesPath)) {
    // В случае упакованного языка — попробуем подтянуть локаль из mip-lang-<lang>
    const packedPluginDir = path.join(process.cwd(), 'plugins', `mip-lang-${langName}`);
    const packedLocalePath = path.join(packedPluginDir, 'locales', `${langName}.json`);

    if (fs.existsSync(packedLocalePath)) {
      fs.mkdirSync(path.dirname(builtinLocalesPath), { recursive: true });
      fs.copyFileSync(packedLocalePath, builtinLocalesPath);
    }
  }

  if (!fs.existsSync(builtinLocalesPath)) {
    console.log(`❌ Language "${langName}" not found`);
    console.log(`Available languages: ${getAvailableCustomLangs().join(', ') || '(none)'}`);
    return;
  }


  // 2) Применяем язык в конфиге проекта
  const config = readConfig();
  if (!config) {
    console.log('❌ No config file found. Run mip init first');
    return;
  }

  config.language = langName;

  // writeConfig всегда пишет mip.yml. Чтобы тесты/проектам было предсказуемо,
  // если mip.yml отсутствует — создаём его из текущего config.
  // (readConfig может читать mip.json, но mip-lang применяет язык через mip.yml)
  writeConfig(config);


  console.log(`✅ Applied language "${langName}"`);
  console.log(`   Run any command to see changes`);
}


async function resetLang() {
  const config = readConfig();
  if (!config) {
    console.log('❌ No config file found. Run mip init first');
    return;
  }

  config.language = 'en';
  writeConfig(config);

  console.log(`✅ Reset language to English (en)`);
}

async function listLangs() {
  const builtin = ['en', 'ru', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko'];
  const custom = getAvailableCustomLangs();
  
  console.log(`\n📋 Available languages:\n`);
  console.log(`Built-in (${builtin.length}):`);
  builtin.forEach(lang => console.log(`  • ${lang}`));

  if (custom.length > 0) {
    console.log(`\nCustom (${custom.length}):`);
    custom.forEach(lang => console.log(`  • ${lang} (from plugin)`));
  } else {
    console.log(`\nCustom: (none)`);
    console.log(`  Create one: mip pe mip-lang create <name>`);
  }

  const currentConfig = readConfig();
  const currentLang = currentConfig?.language || 'en';
  console.log(`\n💡 Current language: ${currentLang}`);
  console.log(`   Change: mip pe mip-lang apply <name>`);
  console.log(`   Reset: mip pe mip-lang reset`);
}

// ==========================================
// MAIN
// ==========================================

module.exports = {
  name: 'mip-lang',
  version: '1.0.0',
  description: 'Custom languages for MIP',

  commands: {
    create: async (args) => {
      await create(args);
    },
    pack: async (args) => {
      await pack(args);
    },
    apply: async (args) => {
      await apply(args);
    },
    reset: async () => {
      await resetLang();
    },
    list: async () => {
      await listLangs();
    },
    help: async () => {
      console.log(`
🌍 mip-lang — custom languages for MIP

Commands:
  create <name> [template]   Create a new language from template
  pack <name>                Package language into a plugin
  apply <name>               Apply language (set in mip.yml)
  reset                      Reset to English (en)
  list                       List all available languages

Examples:
  mip pe mip-lang create pirate en
  mip pe mip-lang pack pirate
  mip pe mip-lang apply pirate
  mip pe mip-lang reset

Templates:
  ${getAvailableTemplates().join(', ')}
      `);
    }
  },

  hooks: {
    onPluginLoad: async (plugin) => {
      console.log(`[mip-lang] 🌍 Language plugin loaded: ${plugin.name}`);
    }
  },

  init: async ({ api }) => {
    ensureDirs();
    console.log('[mip-lang] 🌍 Custom language support loaded!');
    console.log(`[mip-lang]   Templates: ${getAvailableTemplates().join(', ')}`);
    console.log(`[mip-lang]   Custom: ${getAvailableCustomLangs().join(', ') || '(none)'}`);
    console.log(`[mip-lang]   Use: mip pe mip-lang help`);
  }
};
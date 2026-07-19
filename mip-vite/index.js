/*
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │   mip-vite - нативная поддержка Vite для MIP                      │
 * │   Молниеносный HMR и сборка для продакшена                        │
 * └─────────────────────────────────────────────────────────────────────┘
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

module.exports = {
  name: 'mip-vite',
  version: '1.0.0',
  description: 'Нативная поддержка Vite для MIP',

  // ==========================================
  // КОМАНДЫ ПЛАГИНА
  // ==========================================
  commands: {
    // 🔥 Запуск dev-сервера с HMR
    dev: async (args) => {
      const port = args.find(a => a.startsWith('--port='))?.split('=')[1] || 5173;
      const host = args.find(a => a.startsWith('--host='))?.split('=')[1] || 'localhost';

      console.log(`🔥 Starting Vite dev server on ${host}:${port}...`);

      // Проверяем наличие vite.config.js
      const configPath = path.join(process.cwd(), 'vite.config.js');
      if (!fs.existsSync(configPath)) {
        console.log('⚠️ vite.config.js not found, using default config');
      }

      // Запускаем Vite через exec
      const child = spawn('npx', ['vite', '--port', port, '--host', host], {
        stdio: 'inherit',
        shell: true,
        cwd: process.cwd()
      });

      child.on('close', (code) => {
        if (code !== 0) {
          console.log(`❌ Vite server stopped with code ${code}`);
        }
      });

      console.log(`✅ Vite dev server running at http://${host}:${port}`);
    },

    // 📦 Сборка для продакшена
    build: async (args) => {
      const mode = args.includes('--production') ? 'production' : 'development';

      console.log(`📦 Building with Vite (${mode})...`);

      try {
        execSync(`npx vite build --mode ${mode}`, {
          stdio: 'inherit',
          cwd: process.cwd()
        });
        console.log(`✅ Build complete! (${mode})`);
      } catch (err) {
        console.log(`❌ Build failed: ${err.message}`);
      }
    },

    // 🚀 Превью собранного проекта
    preview: async () => {
      console.log('🚀 Previewing build...');
      try {
        execSync('npx vite preview', {
          stdio: 'inherit',
          cwd: process.cwd()
        });
      } catch (err) {
        console.log(`❌ Preview failed: ${err.message}`);
      }
    },

    // 📂 Создание нового Vite проекта
    init: async (args) => {
      const projectName = args[0] || 'my-vite-app';
      const templatePath = path.join(__dirname, 'templates');

      console.log(`📦 Creating Vite project: ${projectName}`);

      const projectPath = path.join(process.cwd(), projectName);
      if (fs.existsSync(projectPath)) {
        console.log(`❌ ${projectName} already exists`);
        return;
      }

      fs.mkdirSync(projectPath, { recursive: true });

      // Копируем шаблоны
      const files = {
        'vite.config.js': fs.readFileSync(path.join(templatePath, 'vite.config.js'), 'utf8'),
        'index.html': fs.readFileSync(path.join(templatePath, 'index.html'), 'utf8'),
        'src/main.js': fs.readFileSync(path.join(templatePath, 'src/main.js'), 'utf8'),
        'src/style.css': fs.readFileSync(path.join(templatePath, 'src/style.css'), 'utf8'),
        'package.json': JSON.stringify({
          name: projectName,
          version: '1.0.0',
          type: 'module',
          scripts: {
            dev: 'mip pe mip-vite dev',
            build: 'mip pe mip-vite build --production',
            preview: 'mip pe mip-vite preview'
          },
          dependencies: {},
          devDependencies: {
            vite: '^5.0.0'
          }
        }, null, 2)
      };

      for (const [file, content] of Object.entries(files)) {
        const fullPath = path.join(projectPath, file);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, content);
        console.log(`  ✅ ${file}`);
      }

      console.log(`\n✅ Vite project created!`);
      console.log(`   cd ${projectName}`);
      console.log(`   mip install`);
      console.log(`   mip pe mip-vite dev`);
    },

    // 🛠️ Добавление Vite в существующий проект
    add: async () => {
      console.log('🛠️ Adding Vite to existing project...');

      const pkgPath = path.join(process.cwd(), 'package.json');
      if (!fs.existsSync(pkgPath)) {
        console.log('❌ package.json not found. Run mip init first');
        return;
      }

      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (!pkg.devDependencies) pkg.devDependencies = {};
      pkg.devDependencies.vite = '^5.0.0';
      pkg.scripts = pkg.scripts || {};
      pkg.scripts.dev = 'mip pe mip-vite dev';
      pkg.scripts.build = 'mip pe mip-vite build --production';
      pkg.scripts.preview = 'mip pe mip-vite preview';

      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      console.log('✅ Added Vite to package.json');

      // Создаём базовый конфиг
      const configPath = path.join(process.cwd(), 'vite.config.js');
      if (!fs.existsSync(configPath)) {
        const config = `
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
`;
        fs.writeFileSync(configPath, config);
        console.log('✅ Created vite.config.js');
      }

      console.log('\n💡 Next steps:');
      console.log('   mip install vite');
      console.log('   mip pe mip-vite dev');
    },

    help: async () => {
      console.log(`
⚡ mip-vite - нативная поддержка Vite для MIP

Commands:
  dev [--port=<port>] [--host=<host>]   Start dev server with HMR
  build [--production]                  Build for production
  preview                               Preview production build
  init <name>                           Create new Vite project
  add                                   Add Vite to existing project

Examples:
  mip pe mip-vite init my-app
  mip pe mip-vite dev --port=3000 --host=0.0.0.0
  mip pe mip-vite build --production
      `);
    },
  },

  // ==========================================
  // ХУКИ
  // ==========================================
  hooks: {
    // Автоматическое обновление конфига при установке Vite
    afterInstall: async (pkgInfo) => {
      if (pkgInfo.name === 'vite') {
        console.log('[mip-vite] ⚡ Vite installed!');
        console.log('[mip-vite]   Run: mip pe mip-vite dev');
      }
    },
  },

  // ==========================================
  // ИНИЦИАЛИЗАЦИЯ
  // ==========================================
  init: async ({ api }) => {
    console.log('[mip-vite] ⚡ Plugin loaded!');
    console.log('[mip-vite]   Commands: dev, build, preview, init, add');
    console.log('[mip-vite]   Use: mip pe mip-vite <command>');
  },
};
/*
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │   mip-tailwind - интеграция с Tailwind CSS для MIP                │
 * │   Генерация стилей и оптимизация для продакшена                   │
 * └─────────────────────────────────────────────────────────────────────┘
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

module.exports = {
  name: 'mip-tailwind',
  version: '1.0.0',
  description: 'Интеграция с Tailwind CSS для MIP',

  // ==========================================
  // КОМАНДЫ ПЛАГИНА
  // ==========================================
  commands: {
    // 🎨 Генерация CSS
    build: async (args) => {
      const watch = args.includes('--watch') || args.includes('-w');
      const minify = args.includes('--minify') || args.includes('-m');
      const input = args.find(a => a.startsWith('--input='))?.split('=')[1] || 'src/input.css';
      const output = args.find(a => a.startsWith('--output='))?.split('=')[1] || 'dist/output.css';

      console.log(`🎨 Building Tailwind CSS...`);
      console.log(`   Input:  ${input}`);
      console.log(`   Output: ${output}`);
      console.log(`   Watch:  ${watch}`);
      console.log(`   Minify: ${minify}`);

      try {
        const cmd = `npx tailwindcss -i ${input} -o ${output} ${watch ? '--watch' : ''} ${minify ? '--minify' : ''}`;
        const child = spawn(cmd, {
          stdio: 'inherit',
          shell: true,
          cwd: process.cwd()
        });

        if (watch) {
          console.log('✅ Tailwind CSS watching for changes...');
          child.on('close', (code) => {
            if (code !== 0) {
              console.log(`❌ Tailwind CSS stopped with code ${code}`);
            }
          });
        } else {
          console.log('✅ Tailwind CSS built successfully!');
          child.on('close', (code) => {
            if (code !== 0) process.exit(code);
          });
        }
      } catch (err) {
        console.log(`❌ Build failed: ${err.message}`);
      }
    },

    // ⚡ Генерация в реальном времени (watch + dev server)
    dev: async (args) => {
      const port = args.find(a => a.startsWith('--port='))?.split('=')[1] || 3000;

      console.log(`⚡ Starting Tailwind CSS dev server on port ${port}...`);

      // Запускаем tailwind в watch-режиме
      const tailwindCmd = 'npx tailwindcss -i src/input.css -o dist/output.css --watch';
      const tailwindChild = spawn(tailwindCmd, {
        stdio: 'pipe',
        shell: true,
        cwd: process.cwd()
      });

      tailwindChild.stdout.on('data', (data) => {
        console.log(`[tailwind] ${data.toString().trim()}`);
      });

      // Запускаем простой HTTP сервер
      const http = require('http');
      const fs = require('fs');
      const path = require('path');

      const server = http.createServer((req, res) => {
        let filePath = path.join(process.cwd(), req.url === '/' ? 'index.html' : req.url);
        const ext = path.extname(filePath);
        const mimeTypes = {
          '.html': 'text/html',
          '.css': 'text/css',
          '.js': 'application/javascript',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml'
        };

        if (!fs.existsSync(filePath)) {
          filePath = path.join(process.cwd(), 'index.html');
        }

        try {
          const content = fs.readFileSync(filePath);
          res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
          res.end(content);
        } catch (err) {
          res.writeHead(404);
          res.end('404 Not Found');
        }
      });

      server.listen(port, () => {
        console.log(`✅ Dev server running at http://localhost:${port}`);
        console.log(`🔄 Tailwind CSS watching for changes...`);
      });
    },

    // 📦 Создание нового проекта с Tailwind
    init: async (args) => {
      const projectName = args[0] || 'my-tailwind-app';
      const templatePath = path.join(__dirname, 'templates');
      const frameworks = ['vanilla', 'react', 'vue'];

      console.log(`🎨 Creating Tailwind CSS project: ${projectName}`);

      const projectPath = path.join(process.cwd(), projectName);
      if (fs.existsSync(projectPath)) {
        console.log(`❌ ${projectName} already exists`);
        return;
      }

      fs.mkdirSync(projectPath, { recursive: true });

      // Копируем шаблоны
      const files = {
        'tailwind.config.js': fs.readFileSync(path.join(templatePath, 'tailwind.config.js'), 'utf8'),
        'postcss.config.js': fs.readFileSync(path.join(templatePath, 'postcss.config.js'), 'utf8'),
        'src/input.css': fs.readFileSync(path.join(templatePath, 'input.css'), 'utf8'),
        'index.html': fs.readFileSync(path.join(templatePath, 'index.html'), 'utf8'),
        'package.json': JSON.stringify({
          name: projectName,
          version: '1.0.0',
          description: 'Tailwind CSS project created with mip-tailwind',
          scripts: {
            dev: 'mip pe mip-tailwind dev',
            build: 'mip pe mip-tailwind build --minify',
            watch: 'mip pe mip-tailwind build --watch'
          },
          dependencies: {},
          devDependencies: {
            tailwindcss: '^3.4.0',
            postcss: '^8.4.0',
            autoprefixer: '^10.4.0'
          }
        }, null, 2)
      };

      for (const [file, content] of Object.entries(files)) {
        const fullPath = path.join(projectPath, file);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, content);
        console.log(`  ✅ ${file}`);
      }

      console.log(`\n✅ Tailwind CSS project created!`);
      console.log(`   cd ${projectName}`);
      console.log(`   mip install`);
      console.log(`   mip pe mip-tailwind dev`);
    },

    // 🛠️ Добавление Tailwind в существующий проект
    add: async (args) => {
      console.log('🛠️ Adding Tailwind CSS to existing project...');

      const pkgPath = path.join(process.cwd(), 'package.json');
      if (!fs.existsSync(pkgPath)) {
        console.log('❌ package.json not found. Run mip init first');
        return;
      }

      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (!pkg.devDependencies) pkg.devDependencies = {};
      pkg.devDependencies.tailwindcss = '^3.4.0';
      pkg.devDependencies.postcss = '^8.4.0';
      pkg.devDependencies.autoprefixer = '^10.4.0';
      pkg.scripts = pkg.scripts || {};
      pkg.scripts.dev = 'mip pe mip-tailwind dev';
      pkg.scripts.build = 'mip pe mip-tailwind build --minify';
      pkg.scripts.watch = 'mip pe mip-tailwind build --watch';

      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      console.log('✅ Added Tailwind CSS to package.json');

      // Создаём tailwind.config.js
      const configPath = path.join(process.cwd(), 'tailwind.config.js');
      if (!fs.existsSync(configPath)) {
        const config = `
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./**/*.{html,js,jsx,ts,tsx,vue}",
    "!./node_modules/**"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;
        fs.writeFileSync(configPath, config);
        console.log('✅ Created tailwind.config.js');
      }

      // Создаём postcss.config.js
      const postcssPath = path.join(process.cwd(), 'postcss.config.js');
      if (!fs.existsSync(postcssPath)) {
        const postcss = `
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;
        fs.writeFileSync(postcssPath, postcss);
        console.log('✅ Created postcss.config.js');
      }

      // Создаём src/input.css
      const cssDir = path.join(process.cwd(), 'src');
      if (!fs.existsSync(cssDir)) fs.mkdirSync(cssDir, { recursive: true });
      const cssPath = path.join(cssDir, 'input.css');
      if (!fs.existsSync(cssPath)) {
        const css = `
@tailwind base;
@tailwind components;
@tailwind utilities;
`;
        fs.writeFileSync(cssPath, css);
        console.log('✅ Created src/input.css');
      }

      console.log('\n💡 Next steps:');
      console.log('   mip install');
      console.log('   mip pe mip-tailwind dev');
    },

    help: async () => {
      console.log(`
🎨 mip-tailwind - интеграция с Tailwind CSS для MIP

Commands:
  build [--watch|-w] [--minify|-m] [--input=<file>] [--output=<file>]
                                Build Tailwind CSS
  dev [--port=<port>]          Start dev server with watch mode
  init <name>                  Create new Tailwind CSS project
  add                          Add Tailwind CSS to existing project

Examples:
  mip pe mip-tailwind init my-app
  mip pe mip-tailwind dev --port=8080
  mip pe mip-tailwind build --minify
  mip pe mip-tailwind build --watch
      `);
    },
  },

  // ==========================================
  // ХУКИ
  // ==========================================
  hooks: {
    // Автоматическое обновление конфига при установке Tailwind
    afterInstall: async (pkgInfo) => {
      if (pkgInfo.name === 'tailwindcss') {
        console.log('[mip-tailwind] 🎨 Tailwind CSS installed!');
        console.log('[mip-tailwind]   Run: mip pe mip-tailwind dev');
      }
    },
  },

  // ==========================================
  // ИНИЦИАЛИЗАЦИЯ
  // ==========================================
  init: async ({ api }) => {
    console.log('[mip-tailwind] 🎨 Plugin loaded!');
    console.log('[mip-tailwind]   Commands: build, dev, init, add');
    console.log('[mip-tailwind]   Use: mip pe mip-tailwind <command>');
  },
};
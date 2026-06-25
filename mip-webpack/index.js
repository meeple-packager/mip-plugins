/*
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │   mip-webpack — полная интеграция MIP с Webpack                    │
 * │   Быстрая сборка и оптимизация бандлов                             │
 * └─────────────────────────────────────────────────────────────────────┘
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const webpack = require('webpack');

module.exports = {
  name: 'mip-webpack',
  version: '1.0.0',
  description: 'Полная интеграция MIP с Webpack',

  // ==========================================
  // КОМАНДЫ ПЛАГИНА
  // ==========================================
  commands: {
    // 🔨 Сборка проекта
    build: async (args) => {
      const configPath = args[0] || 'webpack.config.js';
      const mode = args.includes('--production') ? 'production' : 'development';

      console.log(`🔨 Building with Webpack (${mode})...`);

      const config = require(path.join(process.cwd(), configPath));
      const compiler = webpack({ ...config, mode });

      await new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
          if (err) {
            console.error('❌ Webpack error:', err);
            reject(err);
            return;
          }
          console.log(stats.toString({ colors: true, chunks: false }));
          console.log(`✅ Build complete! (${mode})`);
          resolve();
        });
      });
    },

    // 🚀 Запуск dev-сервера
    dev: async (args) => {
      const configPath = args[0] || 'webpack.config.js';
      const port = args.find(a => a.startsWith('--port='))?.split('=')[1] || 3000;

      console.log(`🚀 Starting dev server on port ${port}...`);

      const config = require(path.join(process.cwd(), configPath));
      const compiler = webpack({ ...config, mode: 'development' });

      const { WebpackDevServer } = require('webpack-dev-server');
      const server = new WebpackDevServer({
        port,
        hot: true,
        open: true,
        historyApiFallback: true,
      }, compiler);

      await server.start();
      console.log(`✅ Dev server running at http://localhost:${port}`);
    },

    // 📦 Создание нового проекта с Webpack
    init: async (args) => {
      const projectName = args[0] || 'my-webpack-app';
      const templatePath = path.join(__dirname, 'templates');

      console.log(`📦 Creating Webpack project: ${projectName}`);

      const projectPath = path.join(process.cwd(), projectName);
      if (fs.existsSync(projectPath)) {
        console.log(`❌ ${projectName} already exists`);
        return;
      }

      fs.mkdirSync(projectPath, { recursive: true });

      // Копируем шаблоны
      const files = {
        'webpack.config.js': fs.readFileSync(path.join(templatePath, 'webpack.config.js'), 'utf8'),
        'src/index.js': fs.readFileSync(path.join(templatePath, 'index.js'), 'utf8'),
        'src/index.html': fs.readFileSync(path.join(templatePath, 'index.html'), 'utf8'),
        'package.json': JSON.stringify({
          name: projectName,
          version: '1.0.0',
          scripts: {
            build: 'mip pe mip-webpack build',
            dev: 'mip pe mip-webpack dev'
          },
          dependencies: {},
          devDependencies: {
            webpack: '^5.88.0',
            'webpack-cli': '^5.1.0',
            'webpack-dev-server': '^4.15.0',
            'html-webpack-plugin': '^5.5.0',
            'babel-loader': '^9.1.0',
            '@babel/core': '^7.22.0',
            '@babel/preset-env': '^7.22.0'
          }
        }, null, 2)
      };

      for (const [file, content] of Object.entries(files)) {
        const fullPath = path.join(projectPath, file);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, content);
        console.log(`  ✅ ${file}`);
      }

      console.log(`\n✅ Webpack project created!`);
      console.log(`   cd ${projectName}`);
      console.log(`   mip install`);
      console.log(`   mip pe mip-webpack dev`);
    },

    help: async () => {
      console.log(`
📦 mip-webpack — полная интеграция MIP с Webpack

Commands:
  build [config]       Build project with Webpack
    --production       Production mode

  dev [config]         Start dev server
    --port=<port>      Custom port (default: 3000)

  init <name>          Create new Webpack project

Examples:
  mip pe mip-webpack init my-app
  mip pe mip-webpack build
  mip pe mip-webpack dev --port=8080
      `);
    },
  },

  // ==========================================
  // ХУКИ
  // ==========================================
  hooks: {
    // Автоматическая установка зависимостей после создания проекта
    afterInstall: async (pkgInfo) => {
      if (pkgInfo.name === 'webpack' || pkgInfo.name === 'webpack-cli') {
        console.log(`[mip-webpack] 🔧 Webpack detected, configuring...`);
      }
    },
  },

  // ==========================================
  // ИНИЦИАЛИЗАЦИЯ
  // ==========================================
  init: async ({ api }) => {
    console.log('[mip-webpack] 🚀 Plugin loaded!');
    console.log('[mip-webpack]   Commands: build, dev, init');
    console.log('[mip-webpack]   Use: mip pe mip-webpack <command>');
  },
};
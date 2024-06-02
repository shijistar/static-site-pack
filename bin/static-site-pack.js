#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const configPath = path.resolve('./static-site-pack.config.js');
const { buildCommand } = require('../lib/commands/build');
const { extractCommand } = require('../lib/commands/extract');
const { exportCommand } = require('../lib/commands/export');
const { importCommand } = require('../lib/commands/import');
const { badWordCommand } = require('../lib/commands/bad-word');

process.env.USP_ENTRY_CWD = path.resolve('./');
process.env.USP_MODULE_CWD = path.join(require.main.path, '/../');
process.env.USP_CONFIG_PATH = configPath;

if (!fs.existsSync(configPath)) {
    throw Error(
        '没有找到static-site-pack的配置文件，请在项目目录下创建static-site-pack.config.js文件，导出一个json对象'
    );
}
const config = require('../lib/config');
if (!config.distDir) {
    console.warn(
        '没有设置static-site-pack.config.js中的 distDir 属性，默认使用`.dist/`作为输出目录。'
    );
}

let envConfig = {
    debug: !!config.debug,
};
const isDev = process.argv.includes('--dev');
if (isDev) {
    envConfig.NODE_ENV = 'development';
} else {
    envConfig.NODE_ENV = 'production';
}

// require.main
const localesDir = path.resolve(path.join('./', config.localesDir));
if (config.enableGlobalization && !fs.existsSync(localesDir)) {
    const errorMsg = `启用了 enableGlobalization 选项，但缺少 'locales' 目录，请手动创建国际化目录`;
    console.error(errorMsg);
    throw new Error(errorMsg);
}

let command = 'build';
if (process.argv.includes('--build')) {
    command = 'build';
} else if (process.argv.includes('--extract')) {
    command = 'extract';
} else if (process.argv.includes('--export')) {
    command = 'export';
} else if (process.argv.includes('--import')) {
    command = 'import';
} else if (process.argv.includes('--bad-word')) {
    command = 'bad-word';
}

const commandContext = {
    config,
    envConfig,
};
switch (command) {
    case 'build':
        buildCommand(commandContext);
        break;
    case 'extract':
        extractCommand(commandContext);
        break;
    case 'export':
        exportCommand(commandContext);
        break;
    case 'import':
        importCommand(commandContext);
        break;
    case 'bad-word':
        // 再增加一个选项，是否高亮显示违禁词（方括号包裹）
        if (process.argv.includes('--highlight')) {
            commandContext.envConfig.highlight = true;
        }
        badWordCommand(commandContext);
        break;
}

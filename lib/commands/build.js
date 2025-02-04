const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

exports.buildCommand = function ({ config, envConfig }) {
    const localesDir = path.resolve(path.join('./', config.localesDir));
    if (envConfig.NODE_ENV === 'development') {
        if (config.enableGlobalization) {
            envConfig.USP_LANG = config.defaultLocale;
            envConfig.USP_LANG_CONFIG_FILE = path.join(localesDir, `${config.defaultLocale}.json`);
        }
        childProcess.spawnSync(
            `npx webpack-dev-server ` +
                `${Object.entries(envConfig)
                    .map(([key, value]) => `--env.${key}=${value}`)
                    .join(' ')} ` +
                `--config ./node_modules/@tiny-codes/static-site-pack/webpack.config.js`,
            { stdio: 'inherit', shell: true }
        );
    } else {
        if (config.enableGlobalization) {
            let languageFiles = fs.readdirSync(localesDir).filter((f) => f.endsWith('.json'));
            for (let file of languageFiles) {
                let lang = file.replace('.json', '');
                envConfig.USP_LANG = lang;
                envConfig.USP_LANG_CONFIG_FILE = path.join(localesDir, file);
                runProduction(envConfig);
            }
        } else {
            runProduction(envConfig);
        }
    }
};

function runProduction(envConfig) {
    childProcess.spawnSync(
        `npx webpack --config ./node_modules/@tiny-codes/static-site-pack/webpack.config.js ` +
            `${Object.entries(envConfig)
                .map(([key, value]) => `--env.${key}="${value}"`)
                .join(' ')} ` +
            ` && npx gulp --gulpfile ./node_modules/@tiny-codes/static-site-pack/gulpfile.js`,
        { stdio: 'inherit', shell: true }
    );
}

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const klawSync = require('klaw-sync');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const LocaleTransformer = require('./locale-transformer');

class I18NPlugin {
    constructor({ locale, defaultLocale, localesDir, allowMissingLocale,
        globalizeHtml = true, excludeGlobalization,

    }) {
        const localeConfigFile = path.join(localesDir, `${locale}.json`);
        this.transformer = new LocaleTransformer({
            locale, defaultLocale, localeConfigFile, allowMissingLocale
        });
        this.locale = locale;
        this.localesDir = localesDir;
        this.globalizeHtml = globalizeHtml;
        this.excludeGlobalization = excludeGlobalization;
    }
    /**
     * @param {webpack.Compiler} compiler
     * @memberof HtmlI18NPlugin
     */
    apply(compiler) {
        compiler.getInfrastructureLogger(I18NPlugin.name).log(`${I18NPlugin.name} apply`);
        if (this.globalizeHtml) {
            compiler.hooks.compilation.tap(I18NPlugin.name, (compilation, compilationParams) => {
                const logger = compilation.getLogger(I18NPlugin.name);
                logger.log(`${I18NPlugin.name} compilation`);

                HtmlWebpackPlugin.getHooks(compilation).afterTemplateExecution.tapAsync(
                    '${I18NPlugin.name} - afterTemplateExecution', // <-- Set a meaningful name here for stacktraces
                    (data, next) => {
                        logger.log(`compilation - HtmlWebpackPlugin - afterTemplateExecution - ${I18NPlugin.name} - ${this.locale} - ${data.outputName}`);
                        try {
                            data.html = this.transformer.transformFile(data.outputName, data.html, {
                                includePatterns: this.globalizeHtml,
                                excludePatterns: this.excludeGlobalization,
                                logger: logger,
                            });
                            // Tell webpack to move on
                            next(null, data);
                        }
                        catch (error) {
                            next(error, data);
                        }
                    }
                );
            });
            // 监听多语言json文件，变化后自动编译
            compiler.hooks.emit.tap(I18NPlugin.name, (compilation) => {
                let localeFiles = klawSync(path.join(this.localesDir), {
                    nodir: true,
                    filter: (item) => item.path.endsWith(".json")
                });
                localeFiles.forEach(i => {
                    compilation.fileDependencies.add(i.path);
                });
            });
        }
    }
}

module.exports = I18NPlugin;
const fs = require('fs');
const path = require('path');
const micromatch = require('micromatch');
const I18NManager = require('./i18n-manager');
const SupportedExtensions = [".html", ".js", ".css"];

class LocaleTransformer {
    constructor({ locale, defaultLocale, localeConfigFile, allowMissingLocale }) {
        this.i18n = new I18NManager({
            locale, defaultLocale, localeConfigFile, allowMissingLocale
        });
    }

    isSupported(file) {
        const extension = path.extname(file);
        return (SupportedExtensions.includes(extension));
    }
    transformFile(file, content, { includePatterns, excludePatterns, logger }) {
        if (logger) {
            logger.log(`${LocaleTransformer.name} - transform - ${file}`);
        }
        let isIncluded = true;
        if (includePatterns !== undefined) {
            if (includePatterns === true) {
                isIncluded = true;
            }
            else {
                isIncluded = micromatch.isMatch(file, includePatterns, {});
            }
        }
        let isExcluded = false;
        if (excludePatterns !== undefined) {
            if (excludePatterns === true) {
                isExcluded = true;
            }
            else {
                isExcluded = micromatch.isMatch(file, excludePatterns);
            }
        }
        if (isIncluded && !isExcluded) {
            const extension = path.extname(file);
            const skipEnvLocales = (localName) => {
                // 如果是全大写的，忽略错误，因为下面一步会替换
                if (localName && localName.toUpperCase() === localName) {
                    return true;
                }
                else {
                    return this.i18n.allowMissingLocale;
                }
            }
            if (extension === ".html") {
                try {
                    const replaceJs = (content) => {
                        content = this.i18n.replaceJsLocale(content, {
                            allowMissingLocale: skipEnvLocales
                        });
                        content = this.i18n.replaceJsEnv(content, {
                            LANG: `${this.i18n.locale}`,
                            DEFAULT_LANG: `${this.i18n.defaultLocale}`,
                            LANG_FILE: `${this.i18n.localeConfigFile}`,
                        });
                        return content;
                    };
                    const replaceHtml = (content) => {
                        content = this.i18n.replaceHtmlLocale(content, {
                            allowMissingLocale: skipEnvLocales
                        });
                        content = this.i18n.replaceHtmlEnv(content, {
                            LANG: `${this.i18n.locale}`,
                            DEFAULT_LANG: `${this.i18n.defaultLocale}`,
                            LANG_FILE: `${this.i18n.localeConfigFile}`,
                        });
                        return content;
                    };
                    if (this.i18n.hasJsLocale(content)) {
                        content = replaceJs(content);
                    }
                    if (this.i18n.hasHtmlLocale(content)) {
                        content = replaceHtml(content);
                    }
                    // html可能引入的partial文件中仍然包含多语言标记，所以需要判断一下，如果存在，则再替换一遍
                    if (this.i18n.hasJsLocale(content)) {
                        content = replaceJs(content);
                    }
                    if (this.i18n.hasHtmlLocale(content)) {
                        content = replaceHtml(content);
                    }
                    return content;
                }
                catch (error) {
                    if (logger) {
                        logger.error(`转换多语言失败！源文件：${file}`);
                    }
                    throw new Error(error);
                }
            }
            else if (extension === ".js" || extension === ".css") {
                let isJs = (extension === ".js");
                try {
                    let replaceLocale = (isJs ? this.i18n.replaceJsLocale : this.i18n.replaceCssLocale);
                    content = replaceLocale.call(this.i18n, content, {
                        allowMissingLocale: skipEnvLocales
                    });
                    let replaceTemplate = (isJs ? this.i18n.replaceJsEnv : this.i18n.replaceCssEnv);
                    content = replaceTemplate.call(this.i18n, content, {
                        LANG: `${this.i18n.locale}`,
                        DEFAULT_LANG: `${this.i18n.defaultLocale}`,
                        LANG_FILE: `${this.i18n.localeConfigFile}`,
                    });
                }
                catch (error) {
                    if (logger) {
                        logger.error(`转换多语言失败！源文件：${file}`);
                    }
                    throw new Error(error);
                }
            }
            else {
                throw new Error(`${LocaleTransformer.name}仅支持转换html,js,css文件。输入的源文件为：${file}`);
            }
        }
        return content;
    }
}

module.exports = LocaleTransformer;
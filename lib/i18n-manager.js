const fs = require('fs');
const path = require('path');
const _ = require('lodash');

class I18NManager {
    constructor({ locale, defaultLocale, localeConfigFile, allowMissingLocale = true }) {
        this.locale = locale;
        this.localeConfigFile = localeConfigFile;
        this.defaultLocale = defaultLocale;
        this.allowMissingLocale = allowMissingLocale;
        this.htmlLocaleInterpolate = /<Locale>\s*([\w\-]+?)\s*<\/Locale>/g; // <Locale>a_1-b.c</Locale>
        this.jsLocaleInterpolate = /\$([a-z|A-Z|_][\w\-]+?)\$/g; //$a_1-b.c$
        this.cssLocaleInterpolate = /\\\$([a-zA-Z_\\][\w\-\\]+?)\\\$/g; //\$a_1-b\.c\$

        try {
            this.languageJson = JSON.parse(fs.readFileSync(this.localeConfigFile));
        } catch (err) {
            const errorMsg = `多语言配置文件\`${this.localeConfigFile}\`不是一个有效的json文件`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }
        let defaultLanguageFile = this.localeConfigFile.replace(`${this.locale}.json`, `${this.defaultLocale}.json`);
        try {
            this.defaultLanguageJson = JSON.parse(fs.readFileSync(defaultLanguageFile));
        } catch (err) {
            this.defaultLanguageJson = {};
        }
    }
    replaceHtmlLocale(content = '', options) {
        return this._replaceLocale(content, this.htmlLocaleInterpolate, options);
    }
    replaceJsLocale(content = '', options) {
        return this._replaceLocale(content, this.jsLocaleInterpolate, options);
    }
    replaceCssLocale(content = '', options) {
        return this._replaceLocale(content, this.cssLocaleInterpolate, options);
    }
    _replaceLocale(
        content = '',
        interpolate,
        { allowMissingLocale = this.allowMissingLocale, fallbackMessage = '', quote = false } = {}
    ) {
        return content.replace(interpolate, (substring, localeName, offset, sourceString) => {
            let translation = this.languageJson[localeName] || this.defaultLanguageJson[localeName];
            if (translation == null) {
                let allowMissing = !!allowMissingLocale;
                if (typeof allowMissingLocale === 'function') {
                    allowMissing = !!allowMissingLocale(localeName);
                }
                if (allowMissing) {
                    translation = fallbackMessage || substring;
                } else {
                    const errorMsg = `国际化资源'${substring}'不存在！`;
                    console.error(errorMsg);
                    throw new Error(errorMsg);
                }
            }
            if (quote) {
                return `"${translation}"`;
            } else {
                return translation;
            }
        });
    }

    replaceHtmlEnv(content = '', args = {}, options) {
        return this._replaceEnv(content, this.htmlLocaleInterpolate, args, options);
    }
    replaceJsEnv(content = '', args = {}, options) {
        return this._replaceEnv(content, this.jsLocaleInterpolate, args, options);
    }
    replaceCssEnv(content = '', args = {}, options) {
        return this._replaceEnv(content, this.cssLocaleInterpolate, args, options);
    }
    _replaceEnv(content = '', interpolate, args = {}, { allowMissingLocale = this.allowMissingLocale } = {}) {
        return content.replace(interpolate, (substring, localeName, offset, sourceString) => {
            let translation = args[localeName];
            if (translation == null) {
                let allowMissing = !!allowMissingLocale;
                if (typeof allowMissingLocale === 'function') {
                    allowMissing = !!allowMissingLocale(localeName);
                }
                if (allowMissing) {
                    translation = substring;
                } else {
                    throw new Error(`国际化资源'${substring}'不存在！`);
                }
            }
            return translation;
        });
    }

    hasHtmlLocale(content) {
        return this.htmlLocaleInterpolate.test(content);
    }
    hasJsLocale(content) {
        return this.jsLocaleInterpolate.test(content);
    }
    hasCssLocale(content) {
        return this.cssLocaleInterpolate.test(content);
    }
}

module.exports = I18NManager;

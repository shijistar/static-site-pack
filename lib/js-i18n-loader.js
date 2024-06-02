const { getOptions } = require('loader-utils');
const validateOptions = require('schema-utils');
const I18NManager = require('./i18n-manager');

const schema = {
    type: 'object',
    properties: {
        // test: {
        //     type: 'string'
        // }
    }
};

module.exports = function (source) {
    const options = getOptions(this);
    validateOptions(schema, options, { name: 'js-i18n-loader' });
    if (options.enableGlobalization) {
        let i18n = new I18NManager({ ...options });
        source = i18n.replaceJsLocale(source, {
            allowMissingLocale: (localName) => {
                // 如果是全大写的，忽略错误，因为下面一步会替换
                if (localName && localName.toUpperCase() === localName) {
                    return true;
                }
                else {
                    return !!options.allowMissingLocale;
                }
            }
        });
        source = i18n.replaceJsEnv(source, {
            LANG: options.locale,
            DEFAULT_LANG: options.defaultLocale,
            LANG_FILE: options.localeConfigFile,
        });
    }
    return source;
}
const path = require('path');

module.exports = {
    distDir: path.resolve('../sample_website_build/dist'),
    ignore: [
        'node_modules/**/*',
        'config/**/*',
        'locales/**/*',
        'data/**/*',
        'package.json',
        'static-site-pack.config.js',
        '.*',
        'index.js',
        '*.sublime-project',
        'README.md'
    ],
    templateHtmlFolders: ['active', 'landing', 'm', 'partial', 'solution', 'substation'],
    extraCopyFiles: [
        {
            from: 'config/nginx/*',
            to: path.resolve('../sample_website_build')
        }
    ],
    gitignore: true,
    // 是否自动包含ES6 polyfill
    includePolyfill: true,
    globalJs: './index.js',
    globalHeadJs: './index_head.js',
    globalCss: './index_css.js',
    // 是否启用国际化，使用<#locale.key#>占位符
    enableGlobalization: true,
    // 是否允许国际化资源缺失，即对于缺失的资源保持原样，不做替换
    allowMissingLocale: false,
    // 默认语言
    defaultLocale: 'zh-cn',
    // 要排除国际化的文件
    excludeGlobalization: ['cmps/**/*', 'doc/**/*', 'huaweiFlyer'],
    enableCDN: false
};

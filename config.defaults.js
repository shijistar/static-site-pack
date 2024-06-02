const path = require('path');

module.exports = {
    // 输出目录
    distDir: path.resolve("./dist"),
    // 忽略拷贝的文件
    ignore: [
        "node_modules/**/*",
        "package.json",
        ".*",
        "*.sublime-project",
        "README.md",
    ],
    // 是否自动包含.gitignore的忽略规则
    gitignore: true,
    // 额外拷贝的文件
    extraCopyFiles: [],
    // 进行模板编译的目录，这些目录之外的html仅拷贝，不会进行模板处理
    templateHtmlFolders: undefined,
    // 设置webpack的stats配置，默认auto，即在development模式下为errors-warnings，在production模式下为errors-only。
    // 其它配置值：'errors-only'、'errors-warnings'、'none'、'normal'、'verbose'
    logLevel: 'auto',
    // 是否自动包含ES6 polyfill
    includePolyfill: true,
    globalJs: "./index.js",
    globalHeadJs: "./index_head.js",
    globalCss: "./index_css.js",
    // 防止partial组件的目录
    partialFolderDir: "partial",
    // 是否启用国际化，使用<#locale.key#>占位符
    enableGlobalization: true,
    // 是否处理html文件中的国际化占位符，或者指定要处理的文件
    globalizeHtml: true,
    // 是否处理js文件中的国际化占位符，或者指定要处理的文件
    globalizeJs: true,
    // 是否处理css文件中的国际化占位符，或者指定要处理的文件
    globalizeCss: true,
    // 国际化多语言文件存放的目录
    localesDir: "locales",
    // 要排除国际化的文件
    excludeGlobalization: [],
    // 默认语言
    defaultLocale: "zh-cn",
    // 是否允许国际化资源缺失，即对于缺失的资源保持原样，不做替换
    allowMissingLocale: false,
    // 防止json数据的目录名称
    dataDir: "json",

    promptDomainName: true,
    defaultDomainName: "sample.com",
    enableCDN: true,
    staticAssetsCdnPrefix: "//www-static-cdn",
    imgAssetsCdnPrefix: "//www-img-cdn",
    imageFileExtensions: "jpg,jpeg,gif,png,bmp,svg,webp,ico",
    mediaAssetsCdnPrefix: "//www-media-cdn",
    videoFileExtensions: "mp3,wav,mp4,wmv,mov,pfk",
    fontFileExtensions: "ttf,ttc,woff,woff2,eot",
    subSites: {}
};

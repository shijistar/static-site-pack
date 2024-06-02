const fs = require("fs-extra");
const path = require('path');
const camelCase = require('camelcase');
const klawSync = require('klaw-sync');
const micromatch = require('micromatch');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInjector = require('html-webpack-injector');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const I18NPlugin = require('./lib/i18n-plugin');
const HtmlTemplatePlugin = require('./lib/html-template-plugin');
const LocaleTransformer = require('./lib/locale-transformer');
const config = require('./lib/config');
// require('webpack').optimize.OccurrenceOrderPlugin

module.exports = runtimeEnv => {
    const isProd = (runtimeEnv.NODE_ENV === "production");
    const envConfig = require('./lib/env');
    const distDir = (config.enableGlobalization ? path.join(config.distDir, runtimeEnv.USP_LANG) : config.distDir);
    let transformer = null;
    if (config.enableGlobalization) {
        transformer = new LocaleTransformer({
            locale: runtimeEnv.USP_LANG,
            localeConfigFile: runtimeEnv.USP_LANG_CONFIG_FILE,
            defaultLocale: config.defaultLocale,
            allowMissingLocale: config.allowMissingLocale,
        });
    }

    //需要编译的html文件
    const htmlFiles = klawSync(process.env.USP_ENTRY_CWD, {
        traverseAll: true,
        filter: (item) => {
            let relativePath = path.relative(process.env.USP_ENTRY_CWD, item.path);
            return item.path.endsWith(".html") && (!relativePath.includes("/") ||
                !config.templateHtmlFolders ||
                Array.isArray(config.templateHtmlFolders) && config.templateHtmlFolders.some(name => relativePath.startsWith(name + "/")));
        }
    });

    // 获取partial文件
    const partialFiles = klawSync(path.join(process.env.USP_ENTRY_CWD, config.partialFolderDir), {
        nodir: true,
        filter: (item) => item.path.endsWith(".html")
    });
    const partialConfig = Object.fromEntries(partialFiles.map(item => [
        camelCase(path.basename(item.path, path.extname(item.path))),
        tryLoad(item.path)
    ]));

    // 设置logLevel，在生产模式下避免输出太多调试信息
    // 'errors-only'、'errors-warnings'、'none'、'normal'、'verbose'
    let logLevel = config.logLevel;
    if (config.logLevel === "auto") {
        logLevel = (isProd ? "errors-only" : "errors-warnings");
    }
    const isLogVisible = ["normal", "verbose"].includes(logLevel);
    // trace, debug, info, warn, error,
    const copyPluginLogLevel = (isLogVisible ? "debug" : "warn");

    // 转化脚本文件（js+css），因为有多处复用，所以提取出来
    const transformScriptFile = function (contentBuffer, file) {
        file = path.relative(process.env.USP_ENTRY_CWD, file);
        if (config.enableGlobalization && transformer.isSupported(file)) {
            const content = transformer.transformFile(file, contentBuffer.toString(), {
                excludePatterns: Array.from(config.excludeGlobalization),
                logger: (isLogVisible ? console : null)
            });
            return Buffer.from(content);
        }
        else {
            return contentBuffer;
        }
    }

    // 设置json目录的pattern，用来判断全局json文件是否发生变化，如果发生变化，自动加载数据
    const dataDirPattern = path.join(process.env.USP_ENTRY_CWD, config.dataDir, "/**/*.json");

    return {
        entry: {
            css_head: [
                path.join(process.env.USP_MODULE_CWD, "index.css"),
                fs.existsSync(config.globalCss) && config.globalCss,
            ].filter(Boolean),
            global_head: [
                path.join(process.env.USP_MODULE_CWD, "index_head.js"),
                fs.existsSync(config.globalHeadJs) && config.globalHeadJs,
            ].filter(Boolean),
            // todo: 将来需要插入到body中，所有script标签的前面，名字去掉_head
            polyfill_head: [
                path.join(process.env.USP_MODULE_CWD, "core-js-custom.js"),
            ].filter(Boolean),
            // todo: 将来需要插入到body中，所有script标签的前面，在polyfill后面
            global: [
                path.join(process.env.USP_MODULE_CWD, "index.js"),
                fs.existsSync(config.globalJs) && config.globalJs,
            ].filter(Boolean),
        },
        output: {
            path: distDir,
            filename: "[name].js"
        },
        mode: runtimeEnv.NODE_ENV,
        devServer: {
            // 如果允许外部访问，可以设置为'0.0.0.0'
            host: "localhost",
            port: envConfig.PORT || 9100,
            contentBase: process.env.USP_ENTRY_CWD,
            open: true,
            compress: true,
            proxy: {},
            stats: logLevel,
        },
        watchOptions: {
            ignored: [...config.ignore]
        },
        // 'errors-only'、'errors-warnings'、'none'、'normal'、'verbose'
        stats: logLevel,
        performance: {
            hints: false,
        },
        module: {
            rules: [
                // {
                //     test: /\.html$/,
                //     loader: 'ejs-loader',
                //     options: {
                //         variable: 'data',
                //         // interpolate: '\\{\\{(.+?)\\}\\}',
                //         // evaluate: '\\[\\[(.+?)\\]\\]'
                //     }
                // },
                {
                    test: /\.js$/,
                    loader: path.join(process.env.USP_MODULE_CWD, "lib/js-i18n-loader"),
                    options: {
                        enableGlobalization: config.enableGlobalization,
                        locale: runtimeEnv.USP_LANG,
                        localeConfigFile: runtimeEnv.USP_LANG_CONFIG_FILE,
                        defaultLocale: config.defaultLocale,
                        allowMissingLocale: config.allowMissingLocale,
                    }
                }, {
                    test: /\.css$/i,
                    loader: require.resolve("css-loader", { paths: [process.env.USP_MODULE_CWD, process.env.USP_ENTRY_CWD] }),
                    options: {
                        localsConvention: 'camelCase',
                    },
                },
            ]
        },
        plugins: [
            isProd && new CleanWebpackPlugin(),
            new CopyPlugin(isProd ?
                [
                    {
                        from: '**/*', to: '',
                        globOptions: { gitignore: !!config.gitignore },
                        transform: transformScriptFile,
                    },
                ]
                :
                [
                    {
                        from: 'js/**/*.js', to: '',
                        globOptions: { gitignore: !!config.gitignore },
                        transform: transformScriptFile,
                    },
                    {
                        from: 'css/**/*.css', to: '',
                        globOptions: { gitignore: !!config.gitignore },
                        transform: transformScriptFile,
                    },
                ], {
                ignore: [
                    ...config.ignore,
                    // 默认排除locales
                    `${config.localesDir}/**/*`,
                    // 默认排除data文件
                    `${config.dataDir}/**/*`,
                    // 排除html同名的json文件
                    ...htmlFiles.map(i => i.path.replace(/\.html$/, ".json")).filter(f => fs.existsSync(f)),
                ].filter(Boolean).map(s => s.trim()),
                symlink: true,
                logLevel: copyPluginLogLevel
            }),
            isProd && new CopyPlugin(config.extraCopyFiles || [], {
                symlink: true,
                logLevel: copyPluginLogLevel
            }),
            ...htmlFiles.map(item => {
                let plugin = new HtmlWebpackPlugin({
                    filename: path.relative(process.env.USP_ENTRY_CWD, item.path),
                    // template: `${path.join(process.env.USP_MODULE_CWD, "lib/html-template-loader.js")}!${path.relative(process.env.USP_ENTRY_CWD, item.path)}`,
                    template: `${path.relative(process.env.USP_ENTRY_CWD, item.path)}`,
                    minify: isProd && {
                        // https://github.com/DanielRuf/html-minifier-terser#options-quick-reference
                        collapseWhitespace: true,
                        keepClosingSlash: true,
                        removeComments: true,
                        removeRedundantAttributes: true,
                        removeScriptTypeAttributes: true,
                        removeStyleLinkTypeAttributes: true,
                        useShortDoctype: true,
                        removeComments: true,
                        minifyJS: true,
                        minifyCSS: true,
                    },
                    cache: true,
                    inject: true,
                    chunks: ["css_head", "global_head", config.includePolyfill && "polyfill_head.js"].filter(Boolean),
                    hash: true,
                    ...partialConfig,
                    /**
                     * @param {webpack.compilation.Compilation} compilation
                     * @param {*} assets
                     * @param {*} options
                     * @returns
                     */
                    templateParameters: function (compilation, assets, assetTags, options) {
                        // 初始化构建数据，仅执行一次
                        let buildData = compilation.__$buildData$__;
                        if (!buildData) {
                            compilation.__$buildData$__ = buildData = {
                                startTime: Date.now(),
                                prevTimestamps: new Map(),
                                hash: compilation.hash,
                                globalJsonData: loadGlobalJsonData(transformer, config)
                            };
                        }
                        //如果修改了全局json，则自动加载全局数据，并缓存在compilation对象上。每次重新编译，仅执行一次
                        const changedFiles = Array.from(compilation.fileTimestamps.keys() &&
                            buildData.hash !== compilation.hash)
                            .filter(file => (this.prevTimestamps.get(file) || this.startTime) < (compilation.fileTimestamps.get(file) || Infinity));
                        if (changedFiles.some(f => micromatch.isMatch(f, dataDirPattern))) {
                            buildData.globalJsonData = loadGlobalJsonData(transformer, config);
                        }
                        // 如果当前页面的json文件发生变化，则自动加载页面json数据
                        let jsonFile = options.filename.replace(/\.html$/, ".json");
                        let pageJsonData = loadPageJsonData(jsonFile, transformer, config);
                        // 重置两个状态
                        if (buildData.prevTimestamps !== compilation.fileTimestamps) {
                            buildData.prevTimestamps = compilation.fileTimestamps;;
                        }
                        if (buildData.hash !== compilation.hash) {
                            buildData.hash = compilation.hash;
                        }
                        return {
                            compilation,
                            webpackConfig: compilation.options,
                            htmlWebpackPlugin: {
                                tags: assetTags,
                                files: assets,
                                options: options
                            },
                            pageData: { ...buildData.globalJsonData, ...pageJsonData },
                            partials: partialConfig,
                            $LANG$: runtimeEnv.USP_LANG,
                            $LANG_FILE$: runtimeEnv.USP_LANG_CONFIG_FILE,
                            $DEFAULT_LANG$: config.defaultLocale,
                        }
                    },
                });
                return plugin;
            }),
            new HtmlWebpackInjector(),
            config.enableGlobalization && new I18NPlugin({
                locale: runtimeEnv.USP_LANG,
                localesDir: path.join(process.env.USP_ENTRY_CWD, config.localesDir),
                defaultLocale: config.defaultLocale,
                globalizeHtml: config.globalizeHtml,
                globalizeJs: config.globalizeJs,
                globalizeCss: config.globalizeCss,
                excludeGlobalization: config.excludeGlobalization,
                allowMissingLocale: config.allowMissingLocale,
            }),
            new HtmlTemplatePlugin({
                dataDir: config.dataDir,
                htmlFiles: htmlFiles.map(i => i.path)
            }),
        ].filter(Boolean)
    };
};

function loadPageJsonData(path, transformer, config) {
    if (fs.existsSync(path)) {
        let content = fs.readFileSync(path).toString();
        if (config.enableGlobalization) {
            content = transformer.i18n.replaceJsLocale(content);
        }
        return JSON.parse(content);
    }
    return {};
}

function loadGlobalJsonData(transformer, config) {
    let dataObj = {};
    if (fs.existsSync(config.dataDir)) {
        let jsonFiles = klawSync(path.join(process.env.USP_ENTRY_CWD, config.dataDir), {
            nodir: true,
            filter: (item) => item.path.endsWith(".json")
        });
        jsonFiles.forEach((f => {
            let content = fs.readFileSync(f.path).toString();
            if (config.enableGlobalization) {
                content = transformer.i18n.replaceJsLocale(content);
            }
            Object.assign(dataObj, JSON.parse(content));
        }));
    }
    return dataObj;
}

function tryLoad(filename, defaultValue) {
    return fs.existsSync(filename) && fs.readFileSync(filename).toString() || defaultValue || "";
}
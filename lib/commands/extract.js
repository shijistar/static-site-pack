const fs = require('fs');
const os = require('os');
const klawSync = require('klaw-sync');
const sha256 = require('js-sha256');
const signale = require('signale');
const colors = require('colors');
const { relative } = require('path');
const { sortFields } = require('../utils/object');

exports.extractCommand = function ({ config, envConfig }) {
    if (!config.enableGlobalization) {
        const errorMsg = `要自动提取国际化资源，必须先启用 enableGlobalization 选项`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }
    let defaultLocales = require(`${process.env.USP_ENTRY_CWD}/${config.localesDir}/${config.defaultLocale}.json`);
    let allLocales = klawSync(`./${config.localesDir}`, {
        traverseAll: false,
        filter: (item) => item.path.endsWith('.json'),
    }).map((item) => ({ path: item.path, data: require(item.path) }));

    signale.start(colors.yellow('开始提取国际化资源'));
    const htmlFiles = klawSync('./', {
        traverseAll: true,
        filter: (item) => {
            let relativePath = require('path').relative('./', item.path);
            return (
                relativePath.endsWith('.html') &&
                !relativePath.startsWith('node_modules') &&
                !relativePath.startsWith('.git')
            );
        },
    });
    htmlFiles.forEach((item) => {
        let content = fs.readFileSync(item.path).toString();
        // 匹配这样的文本，<Locale>这是一段测试文本</Locale>
        const regexp = /\<Locale\>\s*([^<]+?)\s*\<\/Locale\>/;
        let newContent = content.replace(new RegExp(regexp, 'g'), (match, group0, index) => {
            let relativePath = require('path').relative('./', item.path);
            // 把 /\. 替换为横线
            let localeKey = relativePath.replace(/\/|\\|\./g, '-') + '-' + sha256(group0);
            if (defaultLocales.hasOwnProperty(group0)) {
                // 如果已经是国际化资源了，保持不变
                return match;
            } else {
                // 否则，替换为新的国际化资源
                allLocales.forEach((obj) => {
                    obj.data[localeKey] = group0;
                });
                return match.replace(group0, localeKey);
            }
        });
        if (newContent !== content) {
            fs.writeFileSync(item.path, newContent);
            signale.success(`./${relative(process.env.USP_ENTRY_CWD, item.path)} 处理完成`);
        }
    });
    allLocales.forEach((obj) => {
        // 对 json 的 key 进行排序
        let newData = sortFields(obj.data);

        fs.writeFileSync(obj.path, JSON.stringify(newData, null, 4) + os.EOL);
        signale.success(`国际化文件 ./${relative(process.env.USP_ENTRY_CWD, obj.path)} 写入成功`);
    });
    signale.complete(colors.green('操作完成'));
};

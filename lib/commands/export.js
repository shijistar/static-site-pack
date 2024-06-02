const { relative, basename } = require('path');
const { writeFileSync } = require('fs');
const colors = require('colors');
const signale = require('signale');
const klawSync = require('klaw-sync');
const { unparse } = require('papaparse');

exports.exportCommand = function ({ config, envConfig }) {
    signale.start(colors.yellow('开始导出国际化资源'));
    let defaultLocales = require(`${process.env.USP_ENTRY_CWD}/${config.localesDir}/${config.defaultLocale}.json`);
    let otherLocales = klawSync(`./${config.localesDir}`, {
        traverseAll: false,
        filter: (item) =>
            item.path.endsWith('.json') && !item.path.endsWith(`${config.defaultLocale}.json`),
    }).map((item) => ({
        locale: basename(item.path).replace(/\.json$/, ''),
        data: require(item.path),
    }));

    let untranslated = {};

    otherLocales.forEach((item) => {
        Object.keys(item.data).forEach((key) => {
            let value = item.data[key];
            // 所有双字节字符
            if (value.match(/[^\x00-\xff]/)) {
                if (!untranslated[key]) {
                    untranslated[key] = {
                        [config.defaultLocale]: defaultLocales[key] || '',
                    };
                }
                untranslated[key][item.locale] = value || '';
            }
        });
    });
    if (Object.keys(untranslated).length > 0) {
        let rows = [];
        Object.keys(untranslated).forEach((key) => {
            let value = untranslated[key];
            rows.push({
                Key: key,
                ...value,
            });
        });

        try {
            const csv =
                '\ufeff' /* 手动添加BOM，否则Excel打开乱码 */ +
                unparse(rows, {
                    quotes: true,
                });
            let csvFileName = `${process.env.USP_ENTRY_CWD}/${config.localesDir}/未翻译.csv`;
            writeFileSync(csvFileName, csv);
            signale.success(colors.green(`操作完成！`));
            signale.info(
                '请用 Excel 打开' +
                    colors.yellow(`./${relative(process.env.USP_ENTRY_CWD, csvFileName)}`) +
                    `，然后把除了 ${colors.yellow('中文')} 以外的其他列翻译成对应的语言`
            );
            signale.info(
                `翻译完成后，在 Excel 中导出为 ${colors.yellow(
                    '已翻译.csv'
                )}，再把文件拷贝到 ${colors.yellow(config.localesDir)} 目录下`
            );
            signale.info(`最后执行 ${colors.green('yarn import')}`);
        } catch (err) {
            console.error(`文件写入失败！`);
            throw err;
        }
    } else {
        signale.success(
            colors.green('恭喜，国际化都已全部翻译！没有需要导出的国际化资源，操作自动完成！')
        );
    }
};

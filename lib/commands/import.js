const { relative, basename } = require('path');
const { readFileSync, existsSync, writeFileSync } = require('fs');
const colors = require('colors');
const signale = require('signale');
const klawSync = require('klaw-sync');
const { parse } = require('papaparse');
const { stringify } = require('querystring');
const { sortFields } = require('../utils/object');

exports.importCommand = function ({ config, envConfig }) {
    signale.start(colors.yellow('开始导入国际化资源'));
    let filename = `${process.env.USP_ENTRY_CWD}/${config.localesDir}/已翻译.csv`;
    let displayFilename = `./${config.localesDir}/已翻译.csv`;
    if (!existsSync(filename)) {
        signale.error(`未找到国际化资源！请把翻译后的文件放到 ${colors.yellow(displayFilename)}`);
        return;
    }
    try {
        let result = parse(readFileSync(filename).toString());
        if (result.errors && result.errors.length > 0) {
            signale.fatal(`文件 ${displayFilename} 格式错误！`);
            result.errors.forEach((error, index) => {
                signale.error(`错误${index + 1}: `, error.message);
                console.log(error);
                console.log();
            });
            return;
        }

        let headerRow = result.data[0];
        headerRow = headerRow.map((value) => (value || '').trim().toLowerCase());
        let keyIndex = headerRow.findIndex((value) => value === 'key');
        if (keyIndex === -1) {
            signale.fatal(
                `文件 ${colors.yellow(displayFilename)} 中没有找到 ${colors.red('Key')} 列！`
            );
            return;
        }
        for (let colIndex = 0; colIndex < headerRow.length; colIndex++) {
            const col = headerRow[colIndex];
            if (col !== 'key') {
                let localeFile = `${process.env.USP_ENTRY_CWD}/${config.localesDir}/${col}.json`;
                let displayName = `./${config.localesDir}/${col}.json`;
                if (existsSync(localeFile)) {
                    let localeData = require(localeFile);

                    for (let rowIndex = 1; rowIndex < result.data.length; rowIndex++) {
                        const row = result.data[rowIndex];
                        let key = row[keyIndex];
                        if (!key) {
                            signale.error(
                                `第 ${rowIndex + 1} 行数据错误：${colors.red('Key')} 不能为空！`
                            );
                            return;
                        }
                        if (localeData[key] === undefined) {
                            signale.error(
                                `第 ${rowIndex + 1} 行数据错误：Key值 ${colors.red(
                                    key
                                )} 在 ${displayName} 中不存在！翻译的时候不能修改 Key 值！`
                            );
                            return;
                        }
                        localeData[key] = row[colIndex];
                    }

                    localeData = sortFields(localeData);
                    writeFileSync(localeFile, JSON.stringify(localeData, null, 4));
                    signale.success(`资源导入 ${colors.green(displayName)} 成功！`);
                } else {
                    signale.warn(
                        colors.yellow(
                            `列 ${colors.red(col)} 不可识别！这可能是一种国际化语言，但在 ./${
                                config.localesDir
                            } 下并不存在此语言文件，已自动忽略`
                        )
                    );
                }
            }
        }
    } catch (error) {
        signale.fatal(`${filename} 格式错误！`);
        throw error;
    }
    return;
};

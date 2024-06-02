// 提取广告法违禁词

const fs = require('fs');
const path = require('path');
const replaceAll = require('string.prototype.replaceall');
const { unparse } = require('papaparse');
const colors = require('colors');
const signale = require('signale');

exports.badWordCommand = function ({ config, envConfig }) {
    const paths = getPaths();
    signale.start(colors.yellow('开始提取违禁词'));
    signale.info(
        `违禁词文件位置（必须）：./${path.relative(
            process.env.USP_ENTRY_CWD,
            paths.badWordPath
        )}，以逗号或者回车分隔`
    );
    signale.info(
        `安全词文件位置（可选）：./${path.relative(
            process.env.USP_ENTRY_CWD,
            paths.safeWordPath
        )}，以逗号或者回车分隔`
    );
    writeBadWords(!!envConfig.highlight);
};

exports.hasBadWord = hasBadWord;
exports.getBadWords = getBadWords;
exports.writeBadWords = writeBadWords;

function hasBadWord() {
    return getBadWords().length > 0;
}

function load() {
    const paths = getPaths();
    if (!fs.existsSync(paths.badWordPath)) {
        let msg = `违禁词文件不存在！`;
        signale.error(msg);
        throw new Error(msg);
    }
    let keywords = fs
        .readFileSync(paths.badWordPath)
        .toString()
        .split(/\s*[\n|,]\s*/);
    keywords = Array.from(new Set(keywords));

    let safeWords = [];
    if (fs.existsSync(paths.safeWordPath)) {
        safeWords = fs
            .readFileSync(paths.safeWordPath)
            .toString()
            .split(/\s*[\n|,]\s*/);
    }

    let zhCN = require(`${process.env.USP_ENTRY_CWD}/locales/zh-cn.json`);

    return { zhCN, keywords, safeWords };
}

function getPaths() {
    return {
        badWordPath: `${process.env.USP_ENTRY_CWD}/locales/违禁词.txt`,
        safeWordPath: `${process.env.USP_ENTRY_CWD}/locales/安全词.txt`,
        savePath: `${process.env.USP_ENTRY_CWD}/locales/广告法违规词.csv`,
    };
}

/**
 *
 *
 * @returns {{Key:string, Value:string}[]}
 */
function getBadWords(highlight = false) {
    let { zhCN, keywords, safeWords } = load();
    let badEntries = [];
    Object.keys(zhCN).forEach((key) => {
        let value = zhCN[key];
        if (safeWords.some((s) => value.includes(s))) {
            // 只要包含安全词，就都可以跳过
            return;
        }
        let newValue = value;
        let isBad = false;
        for (let i = 0; i < keywords.length; i++) {
            let word = keywords[i];
            if (value.includes(word)) {
                if (highlight) {
                    // 高亮标记，用方括号包裹
                    newValue = replaceAll(newValue, word, `[${word}]`);
                }
                isBad = true;
            }
        }
        if (isBad) {
            badEntries.push({ Key: key, ['zh-cn']: newValue });
        }
    });
    return badEntries;
}

function writeBadWords(highlight = false) {
    const paths = getPaths();
    let badWords = [...getBadWords(highlight)];
    let content = unparse(badWords, { quotes: true });
    console.log(`结果保存到：./${path.relative(process.env.USP_ENTRY_CWD, paths.savePath)}`);
    fs.writeFileSync(paths.savePath, '\ufeff' /* 手动添加BOM，否则Excel打开乱码 */ + content);
}

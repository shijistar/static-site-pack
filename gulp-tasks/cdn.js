const path = require('path');
const gulp = require('gulp');
const { parallel, series } = require('gulp');
const cdnizer = require("gulp-cdnizer");
const using = require('gulp-using');
const config = require('../lib/config');
const inquirer = require('inquirer');
const colors = require('colors');

const DEFAULT_DOMAIN_NAME = config.defaultDomainName || "sample.com";
const CDN_PREFIX_STATIC = config.staticAssetsCdnPrefix || `//www-static-cdn`;
const CDN_PREFIX_IMAGE = config.imgAssetsCdnPrefix || `//www-img-cdn`;
const CDN_PREFIX_MEDIA = config.mediaAssetsCdnPrefix || `//www-media-cdn`;
let subDomainStatic = "";
let subDomainImg = "";
let subDomainMedia = "";

const IMAGE_FILES = config.imageFileExtensions && config.imageFileExtensions.split(",").map(s => s.trim()).filter(Boolean).map(s => `**/*.${s}`) || [
    '**/*.jpg',
    '**/*.jpeg',
    '**/*.gif',
    '**/*.png',
    '**/*.bmp',
    '**/*.svg',
    '**/*.webp',
    '**/*.ico'
];
const VIDEO_FILES = config.videoFileExtensions && config.videoFileExtensions.split(",").map(s => s.trim()).filter(Boolean).map(s => `**/*.${s}`) || [
    '**/*.mp3',
    '**/*.wav',
    '**/*.mp4',
    '**/*.wmv',
    '**/*.mov',
    '**/*.pfk',
];
const FONT_FILES = config.fontFileExtensions && config.fontFileExtensions.split(",").map(s => s.trim()).filter(Boolean).map(s => `**/*.${s}`) || [
    '**/*.ttf',
    '**/*.ttc',
    '**/*.woff',
    '**/*.woff2',
    '**/*.eot'
];

function askForDomainName(done) {
    if (config.promptDomainName) {
        inquirer
            .prompt([
                {
                    type: "input",
                    name: "domainName",
                    message:
                        `${colors.green("输入网站主域名")}
${colors.reset("      请根据部署的目标环境，填写对应的域名")}
${colors.yellow("      注意！发布生产服务器时必须用" + colors.red("生产域名") + "重新编译，否则会使用测试环境的域名，导致线上官网域名错误！！！")}
`,
                    suffix: "请输入:",
                    default: DEFAULT_DOMAIN_NAME,
                }
            ])
            .then(answers => {
                let mainDomain = answers.domainName;
                generateSubCdnDomains(mainDomain);
                printDomainInfo();
                done();
            })
            .catch((reason) => {
                console.error(reason);
                process.exit(1);
            });
    }
    else {
        let mainDomain = DEFAULT_DOMAIN_NAME;
        generateSubCdnDomains(mainDomain);
        printDomainInfo();
        done();
    }
}

function generateSubCdnDomains(mainDomain, subSite) {
    let subSitePath = subSite ? "/" + subSite : "";
    subDomainStatic = `${CDN_PREFIX_STATIC}.${mainDomain}${subSitePath}`;
    subDomainImg = `${CDN_PREFIX_IMAGE}.${mainDomain}${subSitePath}`;
    subDomainMedia = `${CDN_PREFIX_MEDIA}.${mainDomain}${subSitePath}`;
}

function printDomainInfo() {
    console.log();
    console.log("将使用以下CDN域名进行编译，请确认:");
    console.log(`静态脚本域名：${colors.yellow(subDomainStatic)}`);
    console.log(`图片文件域名：${colors.yellow(subDomainImg)}`);
    console.log(`媒体文件域名：${colors.yellow(subDomainMedia)}`);
}

function cdnHtmlFiles(done) {
    gulp.src("**/*.html", {
        cwd: config.distDir
    })
        // .pipe(using({ path: "relative", color: "blue", }))
        .pipe(cdnizer({
            defaultCDNBase: subDomainStatic,
            excludeAbsolute: true,
            files: [
                '**/*.js',
                '**/*.css'
            ],
            matchers: [
                /* Sample: <script src="../js/my.js"> */
                /(<script\s+.*?src=["'])\s*(?:\.\/)*(?:\.\.\/)*(.+?)(["'].*?>)/gi,
                /* Sample: <link href="../css/index/my.css" /> */
                /(<link\s+.*?href=["'])\s*(?:\.\/)*(?:\.\.\/)*([^'"]+)(["'].*?>)/gi,
            ]
        }))
        .pipe(cdnizer({
            defaultCDNBase: subDomainImg,
            excludeAbsolute: true,
            files: [
                ...IMAGE_FILES,
                ...FONT_FILES
            ],
            matchers: [
                /* Sample: <img data-src="../image/sample.png"> */
                /(<img\s+.*?data-src=["'])\s*(?:\.\/)*(?:\.\.\/)*(.+?)(["'].*?>)/gi,
                /(<img\s+.*?src=["'])\s*(?:\.\/)*(?:\.\.\/)*(.+?)(["'].*?>)/gi,
                /* Sample: <image src="../images/index/newlogo.png" /> */
                /(<image\s+.*?src=["'])\s*(?:\.\/)*(?:\.\.\/)*([^'"]+)(["'].*?>)/gi,
            ]
        }))
        .pipe(cdnizer({
            defaultCDNBase: subDomainMedia,
            excludeAbsolute: true,
            files: VIDEO_FILES,
            matchers: [
                /* Sample: <source src="../media/sample.mp3"> */
                /(<source\s+?.*?src\s*=\s*['"])\s*(?:\.\/)*(?:\.\.\/)*([^'"]+)(['"][^>]+>)/gi
            ]
        }))
        .pipe(gulp.dest(config.distDir))
        .on("finish", () => {
            done();
        });
}

function cdnCssFiles(done) {
    gulp.src("**/*.css", {
        cwd: config.distDir
    })
        .pipe(cdnizer({
            defaultCDNBase: subDomainImg,
            // allowRev: true,
            excludeAbsolute: true,
            files: [
                ...IMAGE_FILES,
                ...FONT_FILES
            ],
            matchers: [
                // Sample: url(../images/sample-picture.png)
                /(url\s*\()\s*['"]?\s*(?:\.\/)*(?:\.\.\/)*([^'"()]+)['"]?\s*(\))/gi
            ]
        }))
        .pipe(gulp.dest(config.distDir))
        .on("finish", () => {
            done();
        });
}

function getCdnTask() {
    if (process.env.NODE_ENV === "production" && config.enableCDN) {
        return series(askForDomainName, parallel(cdnHtmlFiles, cdnCssFiles));
    }
    else {
        return function (done) {
            done();
        };
    }
}


module.exports = getCdnTask();
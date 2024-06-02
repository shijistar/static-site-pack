const path = require('path');
const gulp = require('gulp');
const fileInclude = require('gulp-file-include');
const filter = require('gulp-filter');
const using = require('gulp-using');
const config = require('../lib/config');
const filterFile = (file) => {
    let relativePath = path.relative(config.distDir, file.path);
    return file.path.endsWith(".html") && (!relativePath.includes("/") ||
        !config.templateHtmlFolders ||
        Array.isArray(config.templateHtmlFolders) && config.templateHtmlFolders.some(name => relativePath.startsWith(name + "/")));
};

function includeFile(done) {
    gulp.src("**/*.html", {
        cwd: config.distDir
    })
        .pipe(filter(filterFile))
        // .pipe(using({ path: "relative", color: "blue" }))
        .pipe(fileInclude({
            prefix: '@@',
            basepath: config.distDir,
            context: {},
        }))
        .pipe(gulp.dest(config.distDir))
        .on("finish", (...args) => {
            done();
        });
}

module.exports = includeFile;
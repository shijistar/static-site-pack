const path = require('path');
const gulp = require('gulp');
const rev = require('gulp-rev');
const config = require('../lib/config');

function revTask(done) {
    gulp.src('js/**/*')
        .pipe(rev())
        .pipe(gulp.dest(path.join(config.distDir, "js")));
    gulp.src('css/**/*')
        .pipe(rev())
        .pipe(gulp.dest(path.join(config.distDir, "css")));
    gulp.src('images/**/*')
        .pipe(rev())
        .pipe(gulp.dest(path.join(config.distDir, "images")));
    gulp.src('media/**/*')
        .pipe(rev())
        .pipe(gulp.dest(path.join(config.distDir, "media")));

    done();
}

module.exports = revTask;
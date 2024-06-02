const gulp = require('gulp');
const { series } = require('gulp');
const includeFileTask = require('./gulp-tasks/include-file');
const revTask = require('./gulp-tasks/rev');
const cdnTask = require('./gulp-tasks/cdn');

exports.default = series(/* includeFileTask, revTask, */ cdnTask);
var gulp = require('gulp');
var clean = require('gulp-clean');
var less = require('gulp-less');
var minifyCSS = require('gulp-minify-css');
var cssBase64 = require('gulp-css-base64');
var es = require('event-stream');
var rseq = require('gulp-run-sequence');
var zip = require('gulp-zip');
var rename = require('gulp-rename');
var shell = require('gulp-shell');
var jeditor = require("gulp-json-editor");
var peditor = require('gulp-plist');
var app = require('./package');

function pipe(src, transforms, dest) {
  if (typeof transforms === 'string') {
    dest = transforms;
    transforms = null;
  }

  var stream = gulp.src(src);
  transforms && transforms.forEach(function (transform) {
    stream = stream.pipe(transform);
  });

  if (dest) {
    stream = stream.pipe(gulp.dest(dest));
  }

  return stream;
}

gulp.task('styles', function () {
  return gulp.src('./src/less/style.less')
      .pipe(less())
      .pipe(cssBase64())
      .pipe(minifyCSS())
      .pipe(gulp.dest('./src/css'));
});

gulp.task('clean', function () {
  return pipe('./build', [clean()]);
});

gulp.task('chrome', function () {
  return es.merge(
      pipe('./src/js/**/*', './build/chrome/js'),
      pipe('./src/css/**/*', './build/chrome/css'),
      pipe('./src/icons/**/*', './build/chrome/icons'),
      pipe('./vendor/chrome/errors-handler.js', './build/chrome/js'),
      pipe('./vendor/chrome/manifest.json', [
        jeditor({
          'name': app.title,
          'version': app.version,
          'description': app.description,
          'homepage_url': app.homepage
        })
      ], './build/chrome/')
  );
});

gulp.task('firefox', function () {
  return es.merge(
      pipe('./src/js/**/*', './build/firefox/data/js'),
      pipe('./src/css/**/*', './build/firefox/data/css'),
      pipe('./src/icons/**/*', './build/firefox/data/icons'),
      pipe('./vendor/firefox/main.js', './build/firefox/data'),
      pipe('./vendor/firefox/package.json', [
        jeditor({
          'title': app.title,
          'version': app.version,
          'description': app.description,
          'homepage': app.homepage
        })
      ], './build/firefox/')
  );
});

gulp.task('safari', function () {
  return es.merge(
      pipe('./src/js/**/*', './build/safari/handsometrello.safariextension/js'),
      pipe('./src/css/**/*', './build/safari/handsometrello.safariextension/css'),
      pipe('./src/icons/**/*', './build/safari/handsometrello.safariextension/icons'),
      pipe('./vendor/safari/Info.plist', [
        peditor({
          CFBundleDisplayName: app.title,
          CFBundleShortVersionString: app.version,
          Description: app.description,
          Website: app.homepage
        })
      ], './build/safari/handsometrello.safariextension'),
      pipe('./vendor/safari/Settings.plist', './build/safari/handsometrello.safariextension')
  );
});

gulp.task('chrome-dist', function () {
  gulp.src('./build/chrome/**/*')
      .pipe(zip('handsome-trello-chrome-extension-' + app.version + '.zip'))
      .pipe(gulp.dest('./dist/chrome'))
      .pipe(rename('handsome-trello-chrome-extension-latest.zip'))
      .pipe(gulp.dest('./dist/chrome'));
});

gulp.task('firefox-dist', shell.task([
  'mkdir -p dist/firefox',
  'cd ./build/firefox && ../../node_modules/.bin/jpm xpi > /dev/null',
  'mv ./build/firefox/*-' + app.version + '.xpi ./dist/firefox/handsome-trello-firefox-extension-' + app.version + '.xpi',
  'cp ./dist/firefox/handsome-trello-firefox-extension-' + app.version + '.xpi ./dist/firefox/handsome-trello-firefox-extension-latest.xpi'
]));

gulp.task('safari-dist', shell.task([
  'mkdir -p dist/safari',
  'cd ./build/safari && ../../node_modules/.bin/xarjs create extension.safariextz --cert ../../vendor/safari/certs/cert.pem --cert ../../vendor/safari/certs/apple-intermediate.pem --cert ../../vendor/safari/certs/apple-root.pem --private-key ../../vendor/safari/certs/privatekey.pem handsometrello.safariextension',
  'mv ./build/safari/extension.safariextz ./dist/safari/handsome-trello-safari-extension-' + app.version + '.safariextz',
  'cp ./dist/safari/handsome-trello-safari-extension-' + app.version + '.safariextz ./dist/safari/handsome-trello-safari-extension-latest.safariextz'
]));

gulp.task('firefox-run', shell.task([
  'cd ./build/firefox && ../../node_modules/.bin/jpm run'
]));

gulp.task('dist', function (cb) {
  return rseq('clean', ['chrome', 'firefox', 'safari'], ['chrome-dist', 'firefox-dist', 'safari-dist'], cb);
});

gulp.task('watch', function () {
  rseq('default');

  gulp.watch([
    './src/less/**/*',
    './src/fonts/**/*'
  ], ['styles']);

  gulp.watch([
    './src/js/**/*',
    './src/css/**/*',
    './vendor/**/*',
    './package.json'
  ], ['default']);
});

gulp.task('run', function (cb) {
  return rseq('clean', 'firefox', 'firefox-run', cb);
});

gulp.task('addons', shell.task([
  'cp -R ./dist ../addons'
]));

gulp.task('default', function (cb) {
  return rseq('clean', ['chrome', 'firefox', 'safari'], cb);
});

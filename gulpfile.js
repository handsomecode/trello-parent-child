var gulp = require('gulp');
var rimraf = require('rimraf');
var less = require('gulp-less');
var minifyCSS = require('gulp-clean-css');
var cssBase64 = require('gulp-css-base64');
var es = require('event-stream');
var rseq = require('run-sequence');
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

gulp.task('options', function () {
  return gulp.src('./src/less/options.less')
      .pipe(less())
      .pipe(cssBase64())
      .pipe(minifyCSS())
      .pipe(gulp.dest('./src/css'));
});

gulp.task('clean', function () {
  return rimraf.sync('./build');
});

gulp.task('chrome', function () {
  return es.merge(
      pipe('./src/js/**/*', './build/chrome/js'),
      pipe('./src/css/**/*', './build/chrome/css'),
      pipe('./src/icons/**/*', './build/chrome/icons'),
      pipe('./vendor/chrome/data/**/*', './build/chrome'),
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

gulp.task('opera', function () {
  return es.merge(
      pipe('./src/js/**/*', './build/opera/js'),
      pipe('./src/css/**/*', './build/opera/css'),
      pipe('./src/icons/**/*', './build/opera/icons'),
      pipe('./vendor/opera/data/**/*', './build/opera'),
      pipe('./vendor/opera/manifest.json', [
        jeditor({
          'name': app.title,
          'version': app.version,
          'description': app.description,
          'homepage_url': app.homepage
        })
      ], './build/opera/')
  );
});

gulp.task('firefox', function () {
  return es.merge(
      pipe('./src/js/**/*', './build/firefox/data/js'),
      pipe(['./src/css/**/*', '!./src/css/options.css'], './build/firefox/data/css'),
      pipe('./src/icons/**/*', './build/firefox/data/icons'),
      pipe('./vendor/firefox/data/**/*', './build/firefox/data'),
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
      pipe(['./src/css/**/*', '!./src/css/options.css'], './build/safari/handsometrello.safariextension/css'),
      pipe('./src/icons/**/*', './build/safari/handsometrello.safariextension/icons'),
      pipe('./vendor/safari/data/**/*', './build/safari/handsometrello.safariextension'),
      pipe('./vendor/safari/Info.plist', [
        peditor({
          CFBundleDisplayName: app.title,
          CFBundleShortVersionString: app.version,
          Description: app.description,
          Website: app.homepage
        })
      ], './build/safari/handsometrello.safariextension')
  );
});

gulp.task('chrome-dist', function () {
  gulp.src('./build/chrome/**/*')
      .pipe(zip('handsome-trello-chrome-extension-' + app.version + '.zip'))
      .pipe(gulp.dest('./dist/chrome'))
      .pipe(rename('handsome-trello-chrome-extension-latest.zip'))
      .pipe(gulp.dest('./dist/chrome'));
});

gulp.task('opera-dist', function () {
  gulp.src('./build/opera/**/*')
      .pipe(zip('handsome-trello-opera-extension-' + app.version + '.zip'))
      .pipe(gulp.dest('./dist/opera'))
      .pipe(rename('handsome-trello-opera-extension-latest.zip'))
      .pipe(gulp.dest('./dist/opera'));
});

gulp.task('firefox-dist', shell.task([
  'mkdir -p dist/firefox',
  'cd ./build/firefox && ../../node_modules/.bin/jpm xpi > /dev/null',
  'mv ./build/firefox/*.xpi ./dist/firefox/handsome-trello-firefox-extension-' + app.version + '.xpi',
  'cp ./dist/firefox/handsome-trello-firefox-extension-' + app.version + '.xpi ./dist/firefox/handsome-trello-firefox-extension-latest.xpi'
]));

gulp.task('safari-dist', shell.task([
  'mkdir -p dist/safari',
  'cd ./build/safari && ../../node_modules/.bin/xarjs create ../../dist/safari/handsome-trello-safari-extension-' + app.version + '.safariextz --cert ../../vendor/safari/certs/cert.pem --cert ../../vendor/safari/certs/apple-intermediate.pem --cert ../../vendor/safari/certs/apple-root.pem --private-key ../../vendor/safari/certs/privatekey.pem handsometrello.safariextension',
  'cp ./dist/safari/handsome-trello-safari-extension-' + app.version + '.safariextz ./dist/safari/handsome-trello-safari-extension-latest.safariextz'
]));

gulp.task('firefox-run', shell.task([
  'cd ./build/firefox && ../../node_modules/.bin/jpm run -b Nightly --debug'
]));

gulp.task('dist', function (cb) {
  return rseq('clean', ['styles', 'options'], ['chrome', 'opera', 'firefox', 'safari'], ['chrome-dist', 'opera-dist', 'firefox-dist', 'safari-dist'], cb);
});

gulp.task('watch', function () {
  rseq('default', function () {
    gulp.watch([
      './src/less/**/*',
      './src/fonts/**/*'
    ], ['styles', 'options'], ['chrome', 'opera', 'firefox', 'safari']);

    gulp.watch([
      './src/js/**/*',
      './src/css/**/*',
      './vendor/**/*',
      './package.json'
    ], ['default']);
  });
});

gulp.task('run', function (cb) {
  return rseq('clean', ['styles', 'options'], 'firefox', 'firefox-run', cb);
});

gulp.task('addons', shell.task([
  'cp -R ./dist ../addons'
]));

gulp.task('default', function (cb) {
  return rseq('clean', ['styles', 'options'], ['chrome', 'opera', 'firefox', 'safari'], cb);
});

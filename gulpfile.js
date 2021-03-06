const gulp = require('gulp');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const gutil = require('gulp-util')

const paths = {
  src: { js: 'client/*.js' },
  dest: { js: 'public/js' }
};

gulp.task('js', function() {
  return gulp.src(paths.src.js)
    .pipe(sourcemaps.init())
    .pipe(concat('app.min.js'))
    .pipe(uglify())
    .on('error', function (err) { gutil.log(gutil.colors.red('[Error]'), err.toString()); })
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.dest.js));
});

gulp.task('watch', function() {
  gulp.watch(paths.src.js, ['js']); 
});

gulp.task('default', ['watch']);

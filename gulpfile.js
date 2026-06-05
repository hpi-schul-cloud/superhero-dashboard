const {src, dest, series, parallel, watch, lastRun} = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const rimraf = require('gulp-rimraf');
const uglify = require('gulp-uglify');
const cleancss = require('clean-css');
const map = require('vinyl-map');
const babel = require('gulp-babel');
const filelog = require('gulp-filelog');
const plumber = require('gulp-plumber');
const optimizejs = require('gulp-optimize-js');
const concat = require('gulp-concat');
const count = require('gulp-count');
const autoprefixer = require('gulp-autoprefixer');
const cCSS = new cleancss();
const fs = require('fs');
//wrapped in a function so it works with watch (+consistency)
const minify = () => map((buff, filename) =>
    cCSS.minify(buff.toString()).styles);

const beginPipe = function(path) {
    return src(path, { allowEmpty: true, since: lastRun(all) })
        .pipe(plumber())
        .pipe(filelog());
};

const beginPipeAll = path =>
    src(path, { allowEmpty: true, since: lastRun(all) })
        .pipe(plumber())
        .pipe(filelog());

function images() {
    return beginPipe('./static/images/**/*.*')
        .pipe(dest('./build/images'));
}
exports.images = images;

function styles() {
    // Bootstrap is excluded from compilation because it slows down the build. Instead the compiled bootstrap-flex.css is just copied.
    return beginPipe(['./static/styles/**/*.{css,sass,scss}', '!./static/styles/lib/bootstrap/scss/**/*'])
        .pipe(sass({sourceMap: false}))
        .pipe(minify())
        .pipe(autoprefixer())
        .pipe(dest('./build/styles'));
}
exports.styles = styles;

//copy fonts
function fonts() {
    return beginPipe('./static/fonts/**/*.*')
        .pipe(dest('./build/fonts'));
}
exports.fonts = fonts;

//compile/transpile ES6 to ES5 and minify scripts
function scripts() {
    return beginPipe('./static/scripts/**/*.js')
        .pipe(babel({
            presets: [["es2015", { modules: false }]],
        }))
        .pipe(optimizejs())
        .pipe(uglify())
        .pipe(dest('./build/scripts'));
}
exports.scripts = scripts;

//compile vendor SASS/SCSS to CSS and minify it
function vendor_styles() {
    return beginPipe('./static/vendor/**/*.{css,sass,scss}')
        .pipe(sass())
        .pipe(minify())
        .pipe(autoprefixer())
        .pipe(dest('./build/vendor'));
}
exports.vendor_styles = vendor_styles;

// The vendor scripts must be concatenated in certain order, e.g. jquery must come before bootstrap.
function vendor_scripts() {
    return beginPipe([
            './static/vendor/jquery/jquery.min.js',
            './static/vendor/jquery/jquery.serialize-object.js',
            './static/vendor/tether/tether.min.js',
            './static/vendor/bootstrap/bootstrap.min.js',
            './static/vendor/chosen/chosen.jquery.min.js',
            './static/vendor/toggle/bootstrap-toggle.min.js',
        ])
        .pipe(babel({
            compact: false,
            presets: [["es2015", { modules: false }]],
        }))
        .pipe(optimizejs())
        .pipe(uglify())
        .pipe(concat('all_vendor.js'))
        .pipe(dest('./build/scripts'));
}
exports.vendor_scripts = vendor_scripts;

//copy other vendor files
function vendor_assets() {
    return beginPipe(['./static/vendor/**/*.*', '!./static/vendor/**/*.js',
        '!./static/vendor/**/*.{css,sass,scss}'])
        .pipe(dest('./build/vendor'));
}
exports.vendor_assets = vendor_assets;

//clear build folder
function clear() {
    return src(['./build/*'], { read: false })
        .pipe(rimraf());
}
exports.clear = clear;

//run all tasks, processing changed files
const all = series(clear, images, styles, fonts, scripts,
                    vendor_styles, vendor_scripts, vendor_assets);
exports.all = all;

//watch and run corresponding task on change, process changed files only
exports.watch = series(all, (done) => {
    watch('./static/images/**/*.*', images);
    watch('./static/styles/**/*.{css,sass,scss}', styles);
    watch('./static/fonts/**/*.*', fonts);
    watch('./static/scripts/**/*.js', scripts);
    watch('./static/vendor/**/*.{css,sass,scss}', vendor_styles);
    watch('./static/vendor/**/*.js', vendor_scripts);
    watch(['./static/vendor/**/*.*', '!./static/vendor/**/*.js',
                '!./static/vendor/**/*.{css,sass,scss}'], vendor_assets);
    done();
});

//run this if only "gulp" is run on the commandline with no task specified
exports.default = all;

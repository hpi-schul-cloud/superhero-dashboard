const {src, dest, series, watch, lastRun} = require('gulp');
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
const autoprefixer = require('gulp-autoprefixer');
const cCSS = new cleancss();

// wrapped in a function so it works with watch (+consistency)
const minify = () => map((buff) =>
    cCSS.minify(buff.toString()).styles);

const beginPipe = function(path) {
    return src(path, { allowEmpty: true, since: lastRun(all) })
        .pipe(plumber())
        .pipe(filelog());
};

function images() {
    return beginPipe('./static/images/**/*.*')
        .pipe(dest('./build/images'));
}

function styles() {
    // Bootstrap is excluded from compilation because it slows down the build. Instead the compiled bootstrap-flex.css is just copied.
    return beginPipe(['./static/styles/**/*.{css,sass,scss}', '!./static/styles/lib/bootstrap/scss/**/*'])
        .pipe(sass({sourceMap: false}))
        .pipe(minify())
        .pipe(autoprefixer())
        .pipe(dest('./build/styles'));
}

function fonts() {
    return beginPipe('./static/fonts/**/*.*')
        .pipe(dest('./build/fonts'));
}

function scripts() {
    return beginPipe('./static/scripts/**/*.js')
        .pipe(babel({
            presets: [["es2015", { modules: false }]],
        }))
        .pipe(optimizejs())
        .pipe(uglify())
        .pipe(dest('./build/scripts'));
}

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

function vendor_assets() {
    return beginPipe([
            './static/vendor/**/*.*', 
            '!./static/vendor/**/*.js',
            '!./static/vendor/**/*.{sass,scss}'
        ])
        .pipe(dest('./build/vendor'));
}

function clear() {
    return src(['./build/*'], { read: false })
        .pipe(rimraf());
}

const all = series(clear, images, styles, fonts, scripts, vendor_scripts, vendor_assets);

// watch and run corresponding task on change, process changed files only
exports.watch = series(all, (done) => {
    watch('./static/images/**/*.*', images);
    watch('./static/styles/**/*.{css,sass,scss}', styles);
    watch('./static/fonts/**/*.*', fonts);
    watch('./static/scripts/**/*.js', scripts);
    watch('./static/vendor/**/*.js', vendor_scripts);
    watch(['./static/vendor/**/*.*', '!./static/vendor/**/*.js',
                '!./static/vendor/**/*.{sass,scss}'], vendor_assets);
    done();
});

// run this if only "gulp" is run on the commandline with no task specified
exports.default = all;

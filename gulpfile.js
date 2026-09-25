const {src, dest, series, watch} = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const rimraf = require('gulp-rimraf');
const uglify = require('gulp-uglify');
const cleancss = require('clean-css');
const map = require('vinyl-map');
const babel = require('gulp-babel');
const plumber = require('gulp-plumber');
const concat = require('gulp-concat');
const autoprefixer = require('gulp-autoprefixer').default;
const cCSS = new cleancss();

// wrapped in a function so it works with watch (+consistency)
const minify = () => map((buff) =>
    cCSS.minify(buff.toString()).styles);

const beginPipe = function(path) {
    return src(path, { allowEmpty: true })
        .pipe(plumber());
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
    return src('./static/fonts/**/*.*', { allowEmpty: true, encoding: false })
        .pipe(plumber())
        .pipe(dest('./build/fonts'));
}

function scripts() {
    return beginPipe('./static/scripts/**/*.js')
        .pipe(babel({
            presets: [["@babel/preset-env", { modules: false }]],
        }))
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
            presets: [["@babel/preset-env", { modules: false }]],
        }))
        .pipe(uglify())
        .pipe(concat('all_vendor.js'))
        .pipe(dest('./build/scripts'));
}

function vendor_assets() {
    return src('./static/vendor/**/*.*', { allowEmpty: true })
        .pipe(plumber())
        .pipe(dest('./build/vendor'));
}

function clear() {
    return src('./build/', { read: false, allowEmpty: true })
        .pipe(rimraf());
}

const all = series(clear, images, styles, fonts, scripts, vendor_scripts, vendor_assets);

// watch and run corresponding task on change
exports.watch = series(all, (done) => {
    watch('./static/images/**/*.*', images);
    watch('./static/styles/**/*.{css,sass,scss}', styles);
    watch('./static/fonts/**/*.*', fonts);
    watch('./static/scripts/**/*.js', scripts);
    watch('./static/vendor/**/*.js', vendor_scripts);
    watch('./static/vendor/**/*.*', vendor_assets);
    done();
});

// run this if only "gulp" is run on the commandline with no task specified
exports.default = all;


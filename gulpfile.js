const {src, dest, series, parallel, watch, lastRun} = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const sassGrapher = require('gulp-sass-grapher');
const path = require('path');
const rimraf = require('gulp-rimraf');
const uglify = require('gulp-uglify');
const cleancss = require('clean-css');
const map = require('vinyl-map');
const imagemin = require('gulp-imagemin');
const babel = require('gulp-babel');
const filelog = require('gulp-filelog');
const plumber = require('gulp-plumber');
const optimizejs = require('gulp-optimize-js');
const concat = require('gulp-concat');
const count = require('gulp-count');
const autoprefixer = require('gulp-autoprefixer');
const header = require('gulp-header');
const cCSS = new cleancss();
const fs = require('fs');
//wrapped in a function so it works with watch (+consistency)
const minify = () => map((buff, filename) =>
    cCSS.minify(buff.toString()).styles);

const baseScripts = [
    './static/scripts/jquery/jquery.min.js',
    './static/scripts/jquery/jquery.serialize-object.js',
    './static/scripts/tether/tether.min.js',
    './static/scripts/bootstrap/bootstrap.min.js',
    './static/scripts/chosen/chosen.jquery.min.js',
    './static/scripts/base.js',
    './static/scripts/toggle/bootstrap-toggle.min.js',
    './static/scripts/mailchimp/mailchimp.js',
    './static/scripts/qrcode/kjua-0.1.1.min.js'
];

const nonBaseScripts = ['./static/scripts/**/*.js']
    .concat(baseScripts.map(script => '!' + script));

//used by all gulp tasks instead of src(...)
//plumber prevents pipes from stopping when errors occur
//changed only passes on files that were modified since last time
//filelog logs and counts all processed files

function withTheme(path){
    if(typeof path == "string"){
        return [path, `./theme/${themeName()}/${path.slice(2)}`];
    }else{
        return path.concat(path.map(e => {
            return `./theme/${themeName()}/${e.slice(2)}`;
        }));
    }
}

const beginPipe = function(path) {
    return src(withTheme(path), { allowEmpty: true, since: lastRun(all) })
        .pipe(plumber())
        .pipe(filelog());
};

const beginPipeAll = path =>
    src(withTheme(path), { allowEmpty: true, since: lastRun(all) })
        .pipe(plumber())
        .pipe(filelog());

//minify images
function images() {
    return beginPipe('./static/images/**/*.*')
        .pipe(imagemin())
        .pipe(dest('./build/images'));
}
exports.images = images;

function themeName(){
    return process.env.SC_THEME || 'default';
}

var loadPaths = path.resolve('./static/styles/');
sassGrapher.init('./static/styles/', { loadPaths: loadPaths });
function styles() {
    var themeFile = `./theme/${themeName()}/style.scss`;
    return beginPipe('./static/styles/**/*.{css,sass,scss}')
        .pipe(sassGrapher.ancestors())
        .pipe(header(fs.readFileSync(themeFile, 'utf8')))
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

//compile/transpile JSX and ES6 to ES5 and minify scripts
function scripts() {
    return beginPipe(nonBaseScripts)
        .pipe(babel({
            presets: [["es2015", { modules: false }]],
            plugins: ["transform-react-jsx"]
        }))
        .pipe(optimizejs())
        .pipe(uglify())
        .pipe(dest('./build/scripts'));
}
exports.scripts = scripts;


//compile/transpile JSX and ES6 to ES5, minify and concatenate base scripts into all.js
function base_scripts() {
    return beginPipeAll(baseScripts)
        .pipe(count('## js-files selected'))
        .pipe(babel({
            presets: [["es2015", { modules: false }]],
            plugins: ["transform-react-jsx"]
        }))
        .pipe(optimizejs())
        .pipe(uglify())
        .pipe(concat('all.js'))
        .pipe(dest('./build/scripts'));
}
exports.base_scripts = base_scripts;

//compile vendor SASS/SCSS to CSS and minify it
function vendor_styles() {
    return beginPipe('./static/vendor/**/*.{css,sass,scss}')
        .pipe(sass())
        .pipe(minify())
        .pipe(autoprefixer())
        .pipe(dest('./build/vendor'));
}
exports.vendor_styles = vendor_styles;

//compile/transpile vendor JSX and ES6 to ES5 and minify scripts
function vendor_scripts() {
    return beginPipe('./static/vendor/**/*.js')
        .pipe(babel({
            compact: false,
            presets: [["es2015", { modules: false }]],
            plugins: ["transform-react-jsx"]
        }))
        .pipe(optimizejs())
        .pipe(uglify())
        .pipe(dest('./build/vendor'));
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
const all = series(images, styles, fonts, scripts, base_scripts,
                    vendor_styles, vendor_scripts, vendor_assets);
exports.all = all;

//watch and run corresponding task on change, process changed files only
exports.watch = series(all, (done) => {
    watch(withTheme('./static/images/**/*.*'), images);
    watch(withTheme('./static/styles/**/*.{css,sass,scss}'), styles);
    watch(withTheme('./static/fonts/**/*.*'), fonts);
    watch(withTheme(nonBaseScripts), scripts);
    watch(withTheme(baseScripts), base_scripts);
    watch(withTheme('./static/vendor/**/*.{css,sass,scss}'), vendor_styles);
    watch(withTheme('./static/vendor/**/*.js'), vendor_scripts);
    watch(['./static/vendor/**/*.*', '!./static/vendor/**/*.js',
                '!./static/vendor/**/*.{css,sass,scss}'], vendor_assets);
    done();
});

//run this if only "gulp" is run on the commandline with no task specified
exports.default = all;

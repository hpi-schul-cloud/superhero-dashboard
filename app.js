const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');

const session = require('express-session');

// template stuff
const handlebars = require("handlebars");
const layouts = require("handlebars-layouts");
const handlebarsWax = require('handlebars-wax');

const app = express();
app.use(compression());
app.set('trust proxy', true);

app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        [
            "default-src 'self'",
            "img-src 'self' https://upload.wikimedia.org",
            "style-src 'self'",
            "style-src-attr 'unsafe-inline'",
        ].join('; ')
    );
    next();
});

// view engine setup
const handlebarsHelper = require('./helpers/handlebars');
const wax = handlebarsWax(handlebars)
    .partials(path.join(__dirname, 'views/**/*.{hbs,js}'))
    .helpers(layouts)
    .helpers(handlebarsHelper.helpers);


const viewDirs = [path.join(__dirname, 'views')];

app.set('views', viewDirs);
app.engine("hbs", wax.engine);
app.set("view engine", "hbs");

app.set('view cache', true);

app.use(logger('dev'));
app.use(bodyParser.json({limit: process.env.BODYPARSER_LIMIT || '4mb'}));
app.use(bodyParser.urlencoded({extended: true, limit: process.env.BODYPARSER_LIMIT || '4mb'}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'build')));

const sessionStore = new session.MemoryStore;
app.use(session({
    cookie: { maxAge: 60000, httpOnly: true },
    store: sessionStore,
    saveUninitialized: true,
    resave: 'true',
    secret: 'secret',
}));
// Custom flash middleware
app.use(function(req, res, next){
    // if there's a flash message in the session request, make it available in the response, then delete it
    res.locals.notification = req.session.notification;
    delete req.session.notification;
    next();
});

const methodOverride = require('method-override');
app.use(methodOverride('_method')); // for GET requests
app.use(methodOverride((req, res, next) => { // for POST requests
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        var method = req.body._method;
        delete req.body._method;
        return method;
    }
}));


// Initialize the modules and their routes
app.use(require('./controllers/'));

app.get('/', (req,res,next) => {
    res.redirect('/login/');
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    let status = err.status || err.statusCode;
    if (err.statusCode) {
        res.setHeader("error-message", err.message);
        res.locals.message = err.message;
    }else {
        res.locals.message = err.message;
    }
    res.locals.error = req.app.get('env') === 'development' ? err : {status};

    if (res.locals.currentUser)
        res.locals.loggedin = true;
    // render the error page
    res.status(status);
    res.render('lib/error', {
            loggedin: res.locals.loggedin,
        });
});
module.exports = app;

require('dotenv').config();

const createError = require('http-errors'),
    express = require('express'),
    path = require('path'),
    cookieParser = require('cookie-parser'),
    logger = require('morgan'),
    cors = require('cors'),
    _ = require('lodash'),
    bodyParser = require('body-parser'),
    fileUpload = require('express-fileupload'),
    mongoose = require('mongoose'),
    assert = require("assert"),
    session = require('express-session')
    MongoStore = require('connect-mongo')(session);

const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const apiRouter = require('./routes/api');
const filesRouter = require('./routes/api/files');

mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
}).then((err) =>{

})

var db = mongoose.connection;

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

const IN_PROD = app.get('env') === 'production';

app.use(express.static(path.join(__dirname, 'public')));

/*app.use(fileUpload({
  createParentPath: true,
  safeFileNames: true,
  preserveExtension: true,
  abortOnLimit: true,
}))*/
app.use(logger('dev'));
app.use(cors());
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser(`${process.env.secret}`));
app.use(session({
  name: 'sid',
  store: new MongoStore({mongooseConnection: db, secret: process.env.secret, touchAfter: 30*60}),
  secret: process.env.SES_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 2,
    sameSite: true,
    secure: IN_PROD
  }
}));

db.on('error', app.all('/'), (req, res, next) => {
  next(createError(503));
})

app.use('/', indexRouter);
app.use('/api', apiRouter);
app.use('/auth', authRouter);
app.use('/files', filesRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

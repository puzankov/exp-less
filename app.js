let createError = require('http-errors');
let express = require('express');
let path = require('path');
let fs = require('fs');
let cors =  require('cors');
let bodyParser = require('body-parser')
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let sassMiddleware = require('node-sass-middleware');

let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');

let app = express();


let log = (req, res, next) => {
  console.log('Requested: ',req.method, req.url);
  next();
}

let auth =  async (req, res, next) => {
  console.log('Checking auth');

  req.userName = await new Promise((resolve, reject) => {
    setTimeout(()=>{
      resolve('admin');
    }, 1000)
  })

  next();
}

app.use(cors());
app.use(log);
app.use(auth);
// app.use(bodyParser.urlencoded({ extended: false }));



app.post('/', (req, res) => {
  console.log('this is / route second stage');


  console.log(req);


  res.send(`<html><body><h1>Hello ${req.userName}!</h1></body></html>`)
});

var session = require('express-session');
app.use(session({secret: "Shh, its a secret!"}));

app.get('/session/', function(req, res){
  if(req.session.page_views){
    req.session.page_views++;
    res.send("You visited this page " +
        req.session.page_views + " times");
  } else {
    req.session.page_views = 1;
    res.send("Welcome to this page for the first time!");
  }
});



app.all('/api/*', (req, res) => {
  console.log(req.userName);
  let method  = req.method.toLowerCase();
  let filePath = path.join(__dirname, req.path, method + '.json');

  console.log(filePath);

  fs.stat(filePath, (err) => {
    if (err) {
      return res.json({success: false, errorMessage: 'File not Found'})
    }
    res.type('json');

    fs.createReadStream(filePath).pipe(res);
  });

});

// error handler
app.use(function (err, req, res, next) {
  res.status(400).send(err.message)
})




// app.get('/posts/:postId/*', (req, res) => {
//   console.log(req.params);
//   console.log(req.query);
//   res.send(`Post: id = ${req.params.postId} type = ${req.params.type}`)
// });




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true, // true = .sass and false = .scss
  sourceMap: true
}));

app.use(express.static(path.join(__dirname, 'public')));


app.use('/', indexRouter);
app.use('/users', usersRouter);

//catch 404 and forward to error handler
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

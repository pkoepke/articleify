// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use( bodyParser.raw() ); // to support raw-encoded bodies.
app.use( bodyParser.text() ); // to support text-encoded bodies.
app.use( bodyParser.urlencoded({extended: true}) ); // to support URL-encoded bodies.
const Sequelize = require('sequelize');

// listen for requests
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

// Routing requests
// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.post('/postTest', function (request, response) {
  console.log(request.body)
  response.send('Your input was :' + JSON.stringify(request.body));
});

app.post('/makeArticleFromUrl', function (request, response) {
  console.log(request.body)
  response.send('Your input was :' + JSON.stringify(request.body));
});

app.post('/makeArticleFromText', function (request, response) {
  //console.log(request.body.articleText) // For testing only
  let pageText = JSON.stringify(request.body.articleText);
  pageText = pageText.slice(1, -1); // Stringify adds quotes around the string. Remove them.
  pageText = pageText.replace(/\\r\\n/g,"\n"); // Change all \r\n to just \n. For Windows clients.
  // console.log(pageText); // For testing only.
  pageText = pageText.replace(/\n/g,'<br>'); // Change all \n to <br> for HTML display.
  pageText = "<body>".concat(pageText).concat("</body>") // Now that the body is ready, add body opening and closing tags.
  pageText = "<head>".concat("<title>").concat(request.body.articleTitle).concat("</title>").concat("</head>").concat(pageText) // A an HTML HEAD with a TITLE tag. If none was provided title will be an empty string/blank.
  //response.send('Your input was :' + JSON.stringify(request.body)); // For testing only.
  pageText = "<html>".concat(pageText).concat("</html>") // Now that the page is completely readyy, add html opening and closing tags.
  response.send(pageText);
});

// Save article to SQLite DB
function saveArticle(articleUrl, articleTitle, articleText) {
  
}

// Database code with Sequelize

var myDatabase; // myDatabase will be a global variable so all functions can access it.

// setup a new database
// using database credentials set in .env
var sequelize = new Sequelize('database', process.env.DB_USER, process.env.DB_PASS, {
  host: '0.0.0.0',
  dialect: 'sqlite',
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
    // Security note: the database is saved to the file `database.sqlite` on the local filesystem. It's deliberately placed in the `.data` directory
    // which doesn't get copied if someone remixes the project.
  storage: '.data/database.sqlite'
});

// Open the DB connection and authenticate with the database when the script runs
sequelize.authenticate()
  .then(function(err) {
    console.log('Connection has been established successfully.');
    // define a new table 'table1'
    myDatabase = sequelize.define('table1', {
      articleUrl: {
        type: Sequelize.STRING
      },
      articleTitle: {
        type: Sequelize.STRING
      },
      articleText: {
        type: Sequelize.STRING
      }
    });
    
    // Careful, un-commenting this command will drop the database and make a new one! setupDb();
  })
  .catch(function (err) {
    console.log('Unable to connect to the database: ', err);
  });

// populate table with default values. Just for testing, won't be called in production code because it wipes out the previous DB and starts a new one.
function setupDb() {
  myDatabase.sync({force: true}) // using 'force' it drops the table users if it already exists, and creates a new one
    .then(function(){
      myDatabase.create({});
    });  
}

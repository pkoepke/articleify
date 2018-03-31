// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();
const bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use( bodyParser.raw() ); // to support raw-encoded bodies.
app.use( bodyParser.text() ); // to support text-encoded bodies.
app.use( bodyParser.urlencoded({extended: true}) ); // to support URL-encoded bodies.
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

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

app.get('/allArticlesList', function (request, response) {
  let responseText = '<h2>Articleify all articles list</h2>';
  myDatabase.findAll({ }).then(function(articlesArray) {
    for (let articleObject of articlesArray) {
      console.log(JSON.stringify(articleObject))
      let articleifiedUrl = "https://articleify.glitch.me/getArticle?id=" + articleObject.id
      responseText += ("<p><a href=\"" + articleifiedUrl + "\">" + articleifiedUrl + "</a> " + articleObject.articleTitle + "</p>");
    }
    responseText = removeEscapesFromDuobleQuotes(responseText);
    responseText = '<html><head><title>Articleify all articles list</title><link id="favicon" rel="icon" href="https://cdn.rawgit.com/pkoepke/node_sqlite_button_pusher_1/master/favicon.ico" type="image/x-icon"><link rel="stylesheet" href="/style.css"></head>' + responseText + '</html>'
    response.send(responseText);
  });
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
  let articleText = JSON.stringify(request.body.articleText);
  console.log(articleText);
  articleText = articleText.slice(1, -1); // Stringify adds quotes around the string. Remove them.
  articleText = removeCarriageReturn(articleText); // Change all \r\n to just \n. For Windows clients.
  articleText = changeLineFeedsToBr(articleText); // Change all \n to <br> for HTML display.
  articleText = addLoremIpsum(articleText); // Add lorem Ipsum to help Pocket see it as an article.
  articleText = "<body><div class='g-story-body' name='article'>" + articleText + "</div></body>" // Now that the body is ready, add body opening and closing tags, and a Div just to help Pocket along. Not sure the Div helps.
  let articleTitle = request.body.articleTitle
  let savedArticle = saveArticle("","",articleTitle,articleText);
  let responseBody = addHtmlHeaderTags(articleText, "<title>" + articleTitle + "</title>");
  responseBody = addHtmlTags(responseBody);
  response.send(responseBody);
});

// Helper functions for modifying text
function removeCarriageReturn(myString) { // changes \r\n to just \n for a string.
  return myString.replace(/\\r\\n/g,"\n");
}

function changeLineFeedsToBr(myString) { // changes \n to <br> so web pages display it correctly.
  return myString.replace(/\n/g,'<br>');
}

function addLoremIpsum(myString) { // Add Lorem Ipsum to the end of a string. String should be HTML using <br> and <p>, not \n.
  return myString.concat("<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer auctor nulla in tortor consectetur, ut convallis neque iaculis. Ut bibendum tincidunt magna sed faucibus. Fusce condimentum erat leo, ac eleifend neque euismod cursus. Ut nibh nulla, fermentum non dolor vel, lobortis maximus justo. Mauris eu sapien at magna maximus volutpat eu consequat dui. Aliquam erat enim, maximus sit amet rhoncus et, imperdiet vitae lacus. Aliquam convallis ipsum id augue suscipit, non scelerisque neque congue. Phasellus arcu est, condimentum nec interdum finibus, gravida nec arcu. Nunc quis aliquet felis. Sed sodales lacinia orci, ac condimentum tellus fermentum ac. Vivamus cursus nisl odio, quis elementum nisi imperdiet in. Vestibulum metus magna, ornare a egestas id, dapibus vitae enim. Cras bibendum iaculis felis.</p><p>Nunc a tortor nec dolor posuere varius. Donec iaculis condimentum risus eget porta. Cras posuere efficitur urna, vel porta elit ultrices vel. Donec consectetur, turpis vehicula ultricies finibus, enim enim vulputate tellus, vitae consectetur mauris libero et velit. Morbi imperdiet consectetur neque sed condimentum. Suspendisse eget orci vel nisl lacinia viverra. Nullam erat purus, aliquet elementum libero in, lacinia maximus magna. Nulla ac facilisis lorem. Pellentesque ac augue facilisis, ultricies risus eu, laoreet risus. Nam finibus, turpis at maximus malesuada, tellus neque accumsan augue, eu dictum libero nulla vitae est. Pellentesque elit est, imperdiet eget arcu sit amet, sagittis sollicitudin arcu. Mauris et volutpat ante.</p><p>Sed mattis finibus risus. Aliquam eget sodales arcu. Integer vel odio nec nulla ullamcorper placerat. Nam viverra viverra turpis, ut porta nulla fringilla id. Integer ullamcorper neque dolor, quis consequat tellus scelerisque a. Phasellus a pellentesque erat, quis mollis urna. In sit amet vulputate odio. Nam molestie suscipit mauris, eu efficitur tortor viverra eget. Nunc volutpat tellus at nulla fermentum fringilla. Fusce lacinia luctus mauris et feugiat. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>")
}

function removeEscapesFromDuobleQuotes(myString) {
  return myString.replace("\\\"","\"")  
}

let escapedDoubleQuote = '\\"';
console.log(escapedDoubleQuote);
console.log('This is testing removing escapes from double quotes \"');

function addHtmlTags(myString) { // Wraps myString in <html> and </html>
  return "<html>" + myString + "</html>"
}

function addHtmlHeaderTags(myString, optionalTags) { // Wraps myString in <head> and </head>, and adds any strings you want within them.
  return "<head>" + myString + optionalTags + "</head>"
}

// Return an article from the DB. URL must be in format /getArticle?id=<article ID you want>

app.get('/getArticle', function (request, response) {
  let id = request.query.id;
  myDatabase.findAll({ where: {id: id }}).then(function(articleArray) {
    let article = articleArray[0]
      console.log(article)
      let responseText = addHtmlHeaderTags(article.articleText, "<title>" + article.articleTitle + "</title>");
      responseText = removeEscapesFromDuobleQuotes(responseText);
      response.send(responseText);
  })
});

// Save article to SQLite DB
function saveArticle(articleId, articleUrl, articleTitle, articleText) {
  myDatabase.create({ articleUrl: articleUrl, articleTitle: articleTitle, articleText: articleText }).then(article => {
    return article;
  });
}

// Function to drop all articles with ID > 10
setInterval( function() { dropArticlesOver10(); }, 12000);
function dropArticlesOver10() {
  /*myDatabase.destroy({
    where: {
      id: { 
        [Op.gt]: 10
      }
    }
  })*/
  myDatabase.destroy({
    where: {
      id: { 
        [Op.gt]: 10
      }
    }
  })
}

// Database code with Sequelize

var myDatabase; // myDatabase will be a global variable so all functions can access it.

// setup a new database
// using database credentials set in .env
var sequelize = new Sequelize('database', process.env.DB_USER, process.env.DB_PASS, {
  host: '0.0.0.0',
  dialect: 'sqlite',
  operatorsAliases: Op,
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
    
    // Careful, un-commenting this line will drop the DB table and create a new one! setupDb();
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
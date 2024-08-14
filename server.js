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
const http = require('http');
const https = require('https');
const url = require('url');
const cheerio = require('cheerio');
const pdftohtml = require('pdftohtmljs');

// listen for requests
const listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

// Routing requests
// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get('/allArticlesList', (request, response) => {
  let responseText = '<h2>Articleify all articles list</h2>';
  myDatabase.findAll({ }).then( (articlesArray) => {
    for (let articleObject of articlesArray) {
      let articleifiedUrl = "https://articleify.glitch.me/getArticle?id=" + articleObject.id
      responseText += ("<p><a href=\"" + articleifiedUrl + "\">" + articleifiedUrl + "</a> " + articleObject.articleTitle + "</p>");
    }
    responseText = removeEscapesFromDuobleQuotes(responseText);
    responseText = '<html><head><title>Articleify all articles list</title><link id="favicon" rel="icon" href="https://cdn.rawgit.com/pkoepke/node_sqlite_button_pusher_1/master/favicon.ico" type="image/x-icon"><link rel="stylesheet" href="/style.css"></head><body><div class="everythingDiv">' + responseText + '</div></body></html>'
    response.send(responseText);
  });
});

app.post('/makeArticleFromHtmlUrl', (request, response) => {
  let articleTitle = '', articleText = '';
  let currentUrl = request.body.url;
  const currentProtocol = returnHttpOrHttps(currentUrl);
  currentProtocol.get(currentUrl, (pageResponse) => {
    let responseBody = '';
    pageResponse.on('data', function (chunk) {
      responseBody += chunk;
    });
    pageResponse.on('end', function () {
      // const converter = new pdftohtml(responseBody, "sample.html");
      const $ = cheerio.load(responseBody);
      articleTitle = $('title').html();
      articleText = $('body').html();
      articleText = "<main><article>" + articleText + "</article></main>" // Add <main><article> tags.
      saveArticle('','',articleTitle,articleText).then((article) => {
        let id = article.id;
        response.redirect('/getArticle?id=' + id);
      });
    });
  });
});

function returnHttpOrHttps (currentUrl) { // Returns modules depending on which should be used in makeArticleFromHtmlUrl
  if (url.parse(currentUrl).protocol === 'http:') return http
  else return https
}

app.post('/makeArticleFromText', (request, response) => {
  let articleText = request.body.articleText;
  articleText = removeCarriageReturn(articleText); // Change all \r\n to just \n. For Windows clients.
  articleText = changeLineFeedsToBr(articleText); // Change all \n to <br> for HTML display.
  articleText = "<main><article>" + articleText + "</article></main>" // Add <main><article> tag.
  //articleText = addLoremIpsum(articleText); // Add lorem Ipsum to help Pocket see it as an article.
  //articleText = "<div class='g-story-body' name='article'>" + articleText + "</div>" // Now that the body is ready, add body opening and closing tags, and a Div just to help Pocket along. Not sure the Div helps.
  let articleTitle = request.body.articleTitle
  saveArticle("","",articleTitle,articleText).then(function(article) {
    let id = article.id;
    //makeResponse(id).then(madeResponse => response.send(madeResponse));
    response.redirect('/getArticle?id=' + id);
  });
});

app.post('/makeArticleFromFileUpload', (request, response) => {
  response.send('Your input was :' + JSON.stringify(request.body));
});

// Return an article from the DB. URL must be in format /getArticle?id=<article ID you want>

app.get('/getArticle', (request, response) => {
  let id = request.query.id;
  /*myDatabase.findAll({ where: {id: id }}).then(function(articleArray) {
    let article = articleArray[0]
    let responseText = addHtmlHeaderTags(article.articleText, "<title>" + article.articleTitle + "</title>");
    response.send(responseText);
  })*/
  makeResponse(id).then(madeResponse => response.send(madeResponse));
});

// Create response from article ID
function makeResponse(id) {
  return new Promise( (resolve, reject) => {
    myDatabase.findAll({ where: {id: id }}).then( articleArray => {
      let article = articleArray[0]
      let articleUrl = 'https://articleify.glitch.me/getArticle?id=' + id
      article.articleText = '<a href="' + articleUrl + '" id="articleUrl">' + articleUrl + '</a>' + /*'<br><br>' + '<input type="button" id="copyToClipboardButton" value="Copy URL to clipboard" />' +*/ '<br><br>' + article.articleText + '<script src="/client.js"></script>';
      //article.articleText = addLoremIpsum(article.articleText);
      article.articleText = addHtmlBodyTags(article.articleText);
      let responseText = addHtmlHeaderTags(article.articleText, "<title>" + article.articleTitle + "</title>");
      resolve(responseText);
    });
  })
}

// Helper functions for modifying text
function removeCarriageReturn(myString) { // changes \r\n to just \n for a string.
  return myString.replace(/\\r\\n/g,"\n");
}

function changeLineFeedsToBr(myString) { // changes \n to <br> so web pages display it correctly.
  return myString.replace(/\n/g,'<br>');
}

function addLoremIpsum(myString) { // Add Lorem Ipsum to the end of a string. String should be HTML using <br> and <p>, not \n.
  return myString + "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer auctor nulla in tortor consectetur, ut convallis neque iaculis. Ut bibendum tincidunt magna sed faucibus. Fusce condimentum erat leo, ac eleifend neque euismod cursus. Ut nibh nulla, fermentum non dolor vel, lobortis maximus justo. Mauris eu sapien at magna maximus volutpat eu consequat dui. Aliquam erat enim, maximus sit amet rhoncus et, imperdiet vitae lacus. Aliquam convallis ipsum id augue suscipit, non scelerisque neque congue. Phasellus arcu est, condimentum nec interdum finibus, gravida nec arcu. Nunc quis aliquet felis. Sed sodales lacinia orci, ac condimentum tellus fermentum ac. Vivamus cursus nisl odio, quis elementum nisi imperdiet in. Vestibulum metus magna, ornare a egestas id, dapibus vitae enim. Cras bibendum iaculis felis.</p><p>Nunc a tortor nec dolor posuere varius. Donec iaculis condimentum risus eget porta. Cras posuere efficitur urna, vel porta elit ultrices vel. Donec consectetur, turpis vehicula ultricies finibus, enim enim vulputate tellus, vitae consectetur mauris libero et velit. Morbi imperdiet consectetur neque sed condimentum. Suspendisse eget orci vel nisl lacinia viverra. Nullam erat purus, aliquet elementum libero in, lacinia maximus magna. Nulla ac facilisis lorem. Pellentesque ac augue facilisis, ultricies risus eu, laoreet risus. Nam finibus, turpis at maximus malesuada, tellus neque accumsan augue, eu dictum libero nulla vitae est. Pellentesque elit est, imperdiet eget arcu sit amet, sagittis sollicitudin arcu. Mauris et volutpat ante.</p><p>Sed mattis finibus risus. Aliquam eget sodales arcu. Integer vel odio nec nulla ullamcorper placerat. Nam viverra viverra turpis, ut porta nulla fringilla id. Integer ullamcorper neque dolor, quis consequat tellus scelerisque a. Phasellus a pellentesque erat, quis mollis urna. In sit amet vulputate odio. Nam molestie suscipit mauris, eu efficitur tortor viverra eget. Nunc volutpat tellus at nulla fermentum fringilla. Fusce lacinia luctus mauris et feugiat. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>";
}

function removeEscapesFromDuobleQuotes(myString) {
  return myString.replace("\\\"","\"")  
}

function addHtmlBodyTags(myString) { // Wraps myString in <html> and </html>
  return "<body>" + myString + "</body>"
}

function addHtmlHeaderTags(myString, optionalTags) { // Wraps myString in <head> and </head>, and adds any strings you want within them.
  return "<head>" + optionalTags + "</head>" + myString
}

function addHtmlTags(myString) { // Wraps myString in <html> and </html>
  return "<html>" + myString + "</html>"
}

// Save article to SQLite DB
function saveArticle(articleId, articleUrl, articleTitle, articleText) {
  return new Promise((resolve, reject) => { // Help from https://stackoverflow.com/questions/14220321/how-do-i-return-the-response-from-an-asynchronous-call
    myDatabase.create({ articleUrl: articleUrl, articleTitle: articleTitle, articleText: articleText }).then(article => {
      resolve(article);
    });
  });
}

// Function to drop all articles with ID > 10. Runs every 20 minutes:  1 second * 1 minute * 20 minutes.
//setInterval( () => { dropArticlesOver10(); }, 1000 * 60 * 20);
function dropArticlesOver10() {
  myDatabase.destroy({
    where: {
      id: { 
        [Op.gt]: 10
      }
    }
  })
}

// Function to drop all articles more than 24 hours old. Runs every 20 minutes:  1 second * 1 minute * 20 minutes. Also runs whenever the app connects to the DB.
setInterval( () => { dropArticlesMoreThanADayOld(); }, 1000 * 60 * 20);
function dropArticlesMoreThanADayOld() {
  const twentyFourHoursAgo = new Date(Date.now() - (1000 * 60 * 60 * 24)).toISOString() // 24 hours ago: 1 second * 1 minute * 1 hour * 24 hours
  myDatabase.destroy({
    where: {
      updatedAt: { 
        [Op.lt]: twentyFourHoursAgo
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
  logging: false,
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
  .then( (err) => {
    console.log('Successfully established Sequelize connection to database.');
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
    // Functions to run immediately when DB connection is established
    dropArticlesMoreThanADayOld();
    // Careful, un-commenting this line will drop the DB table and create a new one! setupDb();
  })
  .catch( (err) => {
    console.log('Unable to connect to the database: ', err);
  });

// populate table with default values. Just for testing, won't be called in production code because it wipes out the previous DB and starts a new one.
function setupDb() {
  myDatabase.sync({force: true}) // using 'force' it drops the table users if it already exists, and creates a new one
    .then( () => {
      myDatabase.create({});
    });  
}
// Library imports
var request = require("request");
var cheerio = require("cheerio");
var schedule = require("node-schedule");
var fs = require("fs");
var sleep = require("sleep-async")();
var nlp = require("./api.js");


//Server constants
var port = 18197; // WebSocket connection port


//Initialising the socket.io object which abstracts web sockets
var io = require('socket.io').listen(port);

// Dealing with new user connection
io.sockets.on('connection', function (socket) {

    // On generate request generating a customised site for the user and sending it to the client
    socket.on('generate', function (data) {

        var result = nlp.change_text(data);

       io.emit("response", result);

    });
});

//Other constants
var article_file = "articles.json";
var articles_per_site = 6;


/**
 * Gets the text from all <p> tags of 'p_class' on the page.
 * @param page - the page loaded from cheerio, should contain the DOM of the HTML page
 * @param p_class - the class that all <p> tags have which indicates it is article content
 * @returns {string} - the text all concatenated together in one long string
 */
function get_text_from_p(page, p_class) {
	var text = "";

	//Each elem is a <p> tag with text nodes as its children
	page(p_class + " p").each(function(i, elem) {
		for (var i = 0; i<elem.children.length; i++) {
			var child = elem.children[i];

			if (child.type == "text" && child.data != undefined) {
				text += child.data;
			} else if (child.type == "tag") {
				/*
				 * Grandchildren is for cases where there are embedded links in the paragraph
				 * eg, <p>"These have been used as part of the "
				 * 	   <a href="www.choosingwisely.co.uk">Choose Wisely Campaign</a>
				 *     " to highlight the need for patients..."</p>
				 */
				for (var j = 0; j<child.children.length; j++) {
					var grand_child = child.children[j];

					if (grand_child.type == "text" && grand_child.data != undefined) {
						text += grand_child.data;
					}
				}
			}
		}
	});
	return text;
}

/**
 * Gives the full URL of the links. This is because some sites give the full link in their <a> tags,
 * but some sites give a relative path.
 * @param href - the href attribute from the <a> tag
 * @param base_url - the url of the website
 * @returns {*} - the full link to the article
 */
function get_url(href, base_url) {
	var url = base_url;

	//Concat url to base link if href only has path
	if (href.indexOf(url) >= 0) {
		url = href;
	} else {
		url = url.concat(href);
	}

	return url;
}

/**
 * Creates and returns an object with given title and body attributes.
 * @param title - title of the article
 * @param body - the content of the article
 * @returns {Object} - the article object
 */
function create_article(title, body) {
	var article = new Object();
	article.title = title;
	article.body = body;
	return article;
}

/**
 * Gets all articles from a website and turns each article into an object with 'title' and 'body' attributes.
 * All articles are pushed to an array which is returned to the callback function.
 * @param init_url - url where the links to articles can be scraped from, like a front page of a news website. Eg, http://www.bbc.co.uk/news/uk
 * @param base_url - base url of the site where the articles come from. Usually the same as 'init_url' but can be different if 'init_url' is region specific
 * @param a_class - class for <a> tags of links from 'init_url' to each individual article
 * @param t_class - class for the title of the article on the article page
 * @param p_class - class for <p> tags of the content of the article on the article page
 * @param callback - array of article objects are passed to the callback
 */
function get_articles(init_url, base_url, a_class, t_class, p_class, callback) {
	var articles = [];

	request(init_url, function(error, response, body) {
		if(!error) {
			var page = cheerio.load(body);
			var links = page(a_class);

			var callCount = links.length;

			//Scrape each link
			for (var i = 0; i < links.length; i++) {
				var link = links[i];

				var url = get_url(link["attribs"]["href"], base_url);

				//Get text from each link
				request(url, function (error, response, body) {
					if (!error) {

						var page = cheerio.load(body);
						var text = "";

						var title = page(t_class).text();
						text  = get_text_from_p(page, p_class);

						articles.push(create_article(title, text));

						callCount--;

						if(callCount <= 0) {
							callback(articles);
						}
					}
				});
			}
		}
	});
}

function write_to_json(article, title_entities, body_entities) {
	var articles_json = JSON.parse(fs.readFileSync(article_file));

	article.title_entities = title_entities;
	article.body_entities = body_entities
	articles_json.push(article);

	articles_json = JSON.stringify(articles_json);
	fs.writeFileSync(article_file, articles_json);
}

/**
 * Takes all the articles and makes an API call to TextRazor with each article body.
 * Writes the article title, body and response from TextRazor to a .json file.
 * @param articles - array of article objects
 */
function write_to_file(articles) {
	//randomise articles found
	articles.sort(function() {
		return 0.5 - Math.random();
	});

	var call_api = function(articles, articles_pushed, i) {
		var title = articles[i]["title"];
		var body = articles[i]["body"];

		if (title != "" && body != "") {
			nlp.request_api(title, body, function(title_entities, body_entities) {
                if (body_entities != "" && articles[i].title != "") {
                	write_to_json(articles[i], title_entities, body_entities);

                    articles_pushed++;
                }

                //Not out of articles && not enough articles per site
                if (i < articles.length && articles_pushed < articles_per_site) {
                    call_api(articles, articles_pushed, i+1);
                }
			});
		} else {
			if (i < articles.length) {
				call_api(articles, articles_pushed, i+1);
			}
		}
	};

	fs.open(article_file, "a+", function(err, fd) {
		if (err) {

		} else {
			//get first 4 articles and push to json
			call_api(articles, 0, 0);
		}
	});

}

/**
 * Truncates the article_file and fetches new articles to populate the file.
 * @param callback function, the first parameter of the callback is the json array of articles from each site.
 */
function get_new_articles() {
	var sleep_time = 5000;

	//wipe old articles
	fs.writeFileSync(article_file, "[]");

	//fetch new articles from websites
	get_articles("http://www.bbc.co.uk/news/uk", "http://www.bbc.co.uk", ".faux-block-link__overlay-link", ".story-body__h1", ".story-body__inner", write_to_file);
	sleep.sleep(sleep_time, function() {
		get_articles("http://www.theonion.com", "http://www.theonion.com", ".handler", ".content-header", ".content-text", write_to_file);
	});

	// sleep.sleep(sleep_time += sleep_time, function() {
	// 	get_articles("https://www.theguardian.com/uk", "https://www.theguardian.com", ".u-faux-block-link__overlay", ".content__headline", ".content__article-body", write_to_file);
	// });

	sleep.sleep(sleep_time += sleep_time, function() {
		get_articles("http://www.reuters.com", "http://www.reuters.com", ".story-title a", ".article-headline", "#article-text", write_to_file);
	});
}

var fbs = [{"id":"10154521728063503","gender":"male","first_name":"Sizhe","last_name":"Yuen","email":"sizhe@hotmail.com","age_range":{"max":20,"min":18},"picture":{"data":{"height":100,"is_silhouette":false,"url":"https://scontent.xx.fbcdn.net/v/t1.0-1/p100x100/10436699_10152690642708503_6401169838653098176_n.jpg?oh=d4f81f87f06bb5916d5d6bc1b93fdbec&oe=589F7AE0","width":100}}},{"id":"10153796111002085","gender":"male","first_name":"Haakon","last_name":"Brunstad","picture":{"data":{"height":100,"is_silhouette":false,"url":"https://scontent.xx.fbcdn.net/v/t1.0-1/p100x100/10406970_10152586272267085_1462209825294544655_n.jpg?oh=774f24aca90e65a9ff7b3975632c9440&oe=5889557F","width":100}}},{"id":"10210985395850427","gender":"female","first_name":"Katerina","last_name":"Saranti","picture":{"data":{"height":100,"is_silhouette":false,"url":"https://scontent.xx.fbcdn.net/v/t1.0-1/p100x100/12923331_10209072193261558_5087167432243917250_n.jpg?oh=d1e8aa180954113722b92439e75dfc47&oe=58A52676","width":100}}},{"id":"10211383637897343","gender":"male","first_name":"Leo","last_name":"Siddall-Butchers","picture":{"data":{"height":100,"is_silhouette":false,"url":"https://scontent.xx.fbcdn.net/v/t1.0-1/c9.9.358.358/s100x100/13119059_10209…_1672331543538333258_n.jpg?oh=90b5ec11b669963542ec86847943c770&oe=58887F04","width":100}}},{"id":"1547652905249050","gender":"male","first_name":"Bhargava","last_name":"Jariwala","picture":{"data":{"height":100,"is_silhouette":false,"url":"https://scontent.xx.fbcdn.net/v/t1.0-1/p100x100/14695313_1542648582416149_3790261415154618693_n.jpg?oh=a4d26978595481e7311b13230321739f&oe=58A03052","width":100}}},{"id":"1316242925072748","gender":"female","first_name":"Christmas","last_name":"Valkūnaitė","picture":{"data":{"height":100,"is_silhouette":false,"url":"https://scontent.xx.fbcdn.net/v/t1.0-1/p100x100/8352_1105343752829334_7592167699543556518_n.jpg?oh=41bd15a9d38e2980c4e89e0089321e35&oe=58AB58C8","width":100}}},{"id":"1128580687179303","gender":"male","first_name":"Keno","last_name":"Schwalb","picture":{"data":{"height":100,"is_silhouette":false,"url":"https://scontent.xx.fbcdn.net/v/t1.0-1/c77.32.441.441/s100x100/12369101_931…_9051296324011233349_n.jpg?oh=520e01595893494632c145c77466227a&oe=58902858","width":100}}},{"id":"995348063922031","gender":"female","first_name":"Viktorija","last_name":"Nekrasaite","picture":{"data":{"height":100,"is_silhouette":false,"url":"https://scontent.xx.fbcdn.net/v/t1.0-1/p100x100/12087981_767929503330556_4121772023149664427_n.jpg?oh=42a662eb49bbc0ce35fa494594a9643a&oe=588AD165","width":100}}},{"id":"750844111721551","gender":"male","first_name":"Patrick","last_name":"Schrempf","picture":{"data":{"height":100,"is_silhouette":false,"url":"https://scontent.xx.fbcdn.net/v/t1.0-1/p100x100/13423749_686771561462140_1418706061001402702_n.jpg?oh=e3e2e7abc9003a68e018e6a0ebe7c070&oe=5889EDEB","width":100}}},{"id":"709373552559669","gender":"male","first_name":"Martynas","last_name":"Noreika","picture":{"data":{"height":100,"is_silhouette":false,"url":"https://scontent.xx.fbcdn.net/v/t1.0-1/p100x100/11885379_513644115465948_6118659685877601275_n.jpg?oh=a843ad2dd84fc83404ab4e4b0c171c17&oe=588E09BC","width":100}}}]
console.log(nlp.change_text(JSON.stringify(fbs)));
// get_new_articles();

/**
 * Schedules new articles to be pulled every day at 09:00am
 */
var j =  schedule.scheduleJob({hour: 09, minute: 00}, function() {
	console.log("fetching new articles...");
	get_new_articles();
});

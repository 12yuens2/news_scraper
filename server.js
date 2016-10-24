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

get_new_articles();

/**
 * Schedules new articles to be pulled every day at 09:00am
 */
var j =  schedule.scheduleJob({hour: 09, minute: 00}, function() {
	console.log("fetching new articles...");
	get_new_articles();
});

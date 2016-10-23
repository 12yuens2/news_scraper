// Library imports
var request = require("request");
var cheerio = require("cheerio");
var schedule = require("node-schedule");
var fs = require("fs");
var sleep = require("sleep-async")();
var nlp = require("./api.js");



//Server constants
var port = 5000; // WebSocket connection port


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
var articles_per_site = 4;

function get_article(init_url, base_url, a_class, t_class, p_class, callback) {
	var articles = [];

	request(init_url, function(error, response, body) {
		if(!error) {
			var page = cheerio.load(body);
			var links = page(a_class);

			var callCount = links.length;

			//go scrape each link
			for (var i = 0; i < links.length; i++) {
				var link = links[i];

				var href = link["attribs"]["href"];
				var url = base_url;

				if (href.indexOf(url) >= 0) {
					url = href;
				} else {
					url = url.concat(href);
				}

				//get text from each link
				request(url, function (error, response, body) {
					if (!error) {

						var page = cheerio.load(body);
						var text = "";

						//get each paragraph
						page(p_class + " p").each(function(i, elem) {
							for (var i = 0; i<elem.children.length; i++) {
								var child = elem.children[i];
								if (child.type == "text" && child.data != undefined) {
									text += (child.data) + "\n";
								}
							}
						});

						var title = page(t_class).text();

						var obj = new Object();
						obj.title = title;
						obj.body = text;
						articles.push(obj);
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

function write_to_file(articles) {
	//randomise articles found
	articles.sort(function() {
		return 0.5 - Math.random();
	});

	var articles_json = JSON.parse(fs.readFileSync(article_file));

	var call_api = function(articles, articles_pushed, i) {
		// console.log("API called started at " + new Date().getTime());
		var text = articles[i]["body"];
		if (text != "") {
			nlp.request_api(text, function(entities) {
                if (entities != "") {
                    articles_json = JSON.parse(fs.readFileSync(article_file));

                    articles[i].entities = entities;
                    articles_json.push(articles[i]);

                    articles_json = JSON.stringify(articles_json);
                    fs.writeFileSync(article_file, articles_json);

                    articles_pushed++;
                }

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
	get_article("http://www.bbc.co.uk/news/uk", "http://www.bbc.co.uk", ".faux-block-link__overlay-link", ".story-body__h1", ".story-body__inner", write_to_file);
	sleep.sleep(sleep_time, function() {
		get_article("http://www.theonion.com", "http://www.theonion.com", ".handler", ".content-header", ".content-text", write_to_file);
	});

	sleep.sleep(sleep_time += sleep_time, function() {
		get_article("https://www.theguardian.com/uk", "https://www.theguardian.com", ".u-faux-block-link__overlay", ".content__headline", ".content__article-body", write_to_file);
	});

	sleep.sleep(sleep_time += sleep_time, function() {
		get_article("http://www.reuters.com", "http://www.reuters.com", ".story-title a", ".article-headline", "#article-text", write_to_file);
	});
}


var j =  schedule.scheduleJob({hour: 09, minute: 00}, function() {
	console.log("fetching new articles...");
	get_new_articles();
});


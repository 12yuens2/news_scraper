// Library imports
var request = require("request");
var cheerio = require("cheerio");


// Server constants
var port = 5000; // WebSocket connection port
var i = 0;
var s = 6;
var initUrl = "http://www.bbc.co.uk/news/uk";
var articles = [];
var file = "articles.json";

// Initialising the socket.io object which abstracts web sockets
var io = require('socket.io').listen(port);

// Dealing with new user connection
io.sockets.on('connection', function (socket) {

    // On generate request generating a customised site for the user and sending it to the client
    socket.on('generate', function () {
        do_all(function(articles) {
            io.emit("response", articles);
        });
    });
});


function do_request(init_url, base_url, a_class, t_class, p_class, callback) {
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
						var text = page(p_class + " p").text();
						var title = page(t_class).text();

						var obj = new Object();
						obj.title = title;
						obj.body = text;
						articles.push(obj);
						--callCount;
					}

					//callback when done with all links
					if (callCount <= 0) {
						callback(articles);
					}
				});
			}
		}
	});
}


/**
 * Makes requests to all links of all websites.
 * @param callback function, the first parameter of the callback is the json array of articles/
 */
function do_all(callback){
	do_request("http://www.bbc.co.uk/news/uk", "http://www.bbc.co.uk", ".faux-block-link__overlay-link", ".story-body__h1", ".story-body__inner", callback);
	// do_request("https://www.theguardian.com/uk", "https://www.theguardian.com", ".u-faux-block-link__overlay", ".content__headline", ".content__article-body", callback);
	// do_request("http://www.reuters.com", "http://www.reuters.com", ".story-title a", "#article-text", callback);
}

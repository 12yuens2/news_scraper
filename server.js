// Library imports
var fs = require("fs");
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
        console.log("generate request");
    });
});

















// NEEDS TO BE REFACTORED!!!


function process_nlp(sentence) {
	sentence = nlp.sentence(sentence).replace("[Place]", "Lithuania").text();
	sentence = nlp.sentence(sentence).replace("[Person]", "Martynas").text();
	return nlp.sentence(sentence).replace("[Organization]", "University of St. Andrews").text();
	// return nlp.text(sentence).terms();
	// return nlp.noun("Colchester").is_place();
}

function do_request(init_url, base_url, a_class, t_class, p_class) {
	console.log("NEWS FROM " + init_url);
	console.log("-------------------------------------------")
	request(init_url, function(error, response, body) {
	if(!error) {
		var page = cheerio.load(body);
		var links = page(a_class);
		var article = "";
		links.each(function(i, link) {
			var href = link["attribs"]["href"];
			var url = base_url;
			// console.log(link);
			if (href.indexOf(url) >= 0) {
				url = href;
			} else {
				url = url.concat(href);
			}
			// console.log(url);

				request(url, function(error, response, body) {
					if(!error) {
						var page = cheerio.load(body);
						var text = page(p_class + " p").text();
						var title = page(t_class).text();

						var obj = new Object();
						obj.title = title;
						obj.body = text;
						articles.push(obj);

						// jsonfile.writeFile(file, articles, function(err) {
						// 	// console.log(err);
						// });
						// if(text) {
						// 	sentences.forEach(function(sentence) {
						// 		article = article + sentence +"\n";
						// 	});
						// 	articles.push(article);
						// 	console.log("pushed");
							//console.log(JSON.stringify(articles));
						// 	console.log("=======================")
						// }
					}
				});
			});
		}
	});
	console.log("--------------------------------------------------")
}

function do_all(){
	do_request("http://www.bbc.co.uk/news/uk", "http://www.bbc.co.uk", ".faux-block-link__overlay-link", ".story-body__h1", ".story-body__inner");
	// do_request("https://www.theguardian.com/uk", "https://www.theguardian.com", ".u-faux-block-link__overlay", ".content__headline", ".content__article-body");
	// do_request("http://www.reuters.com", "http://www.reuters.com", ".story-title a", "#article-text");
	

}

//do_all();
// do_request("http://www.bbc.co.uk/news/uk", "http://www.bbc.co.uk", ".faux-block-link__overlay-link", ".story-body__inner");
// do_request("https://www.theguardian.com/uk", "https://www.theguardian.com", ".u-faux-block-link__overlay", ".content__article-body");
// do_request("http://www.reuters.com", "http://www.reuters.com", ".story-title a", "#article-text");
// do_request("http://edition.cnn.com", "http://edition.cnn.com", ".cd__headline a", ".l-container")
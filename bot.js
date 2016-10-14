
var fs = require("fs");
var request = require("request");
var cheerio = require("cheerio");
var nlp = require("nlp_compromise");

var initUrl = "http://www.bbc.co.uk/news/uk";

// request(url, function(error, response, body) {
// 	if (!error) {
// 		var page = cheerio.load(body);
// 		var text = page(".story-body__inner").text();

// 		text = text.replace(/\s+/g, " ")
// 				.replace(/[^a-zA-Z ]/g, "");

// 		console.log(text);
// 	}
// });#

var i = 1;
var s = 6;

function process_nlp(sentence) {
	sentence = nlp.sentence(sentence).replace("[Place]", "Lithuania").text();
	sentence = nlp.sentence(sentence).replace("[Person]", "Martynas").text();
	return nlp.sentence(sentence).replace("[Organization]", "University of St. Andrews").text();
	// return nlp.text(sentence).terms();
	// return nlp.noun("Colchester").is_place();
}

// request(initUrl, function(error, response, body) {
// 	if(!error) {
// 		var page = cheerio.load(body);
// 		var links = page(".faux-block-link__overlay-link");

// 		links.each(function(i, link) {
// 			var href = link["attribs"]["href"];
// 			var url = "http://www.bbc.co.uk";
// 			url = url.concat(href);

// 			// console.log(url);
// 			// if (i === 2) {
// 				request(url, function(error, response, body) {
// 					if(!error) {
// 						var page = cheerio.load(body);
// 						var text = page(".story-body__inner p").text();

// 						// text = text.replace(/\s+/g, " ")
// 						// 		.replace(/[^a-zA-Z ]/g, "");
// 						var sentences = text.split(".");
// 						if(text) {
// 							sentences.forEach(function(sentence) {
// 								console.log(process_nlp(sentence));
// 								console.log(" ");
// 								console.log(sentence);
// 								console.log(" ");
// 								console.log("==================")
// 							});
// 							// console.log(process_nlp(sentences[s]));
// 							// console.log(sentences[s]);
// 							// console.log(text);
// 							// console.log("=================");
// 						}
// 					}
// 				});
// 				// i++;
// 			// }
// 		});
// 	}
// });

function do_request(init_url, base_url, a_class, p_class) {
	console.log("NEWS FROM " + init_url);
	console.log("-------------------------------------------")
	request(init_url, function(error, response, body) {
	if(!error) {
		var page = cheerio.load(body);
		var links = page(a_class);

		links.each(function(i, link) {
			var href = link["attribs"]["href"];
			var url = base_url;
			// console.log(link);
			if (href.indexOf(url) >= 0) {
				url = href;
			} else {
				url = url.concat(href);
			}
			console.log(url);
			// if (i === 2) {
				request(url, function(error, response, body) {
					if(!error) {
						var page = cheerio.load(body);
						var text = page(p_class + " p").text();

						// text = text.replace(/\s+/g, " ")
						// 		.replace(/[^a-zA-Z ]/g, "");
						var sentences = text.split(".");
						if(text) {
							sentences.forEach(function(sentence) {
								console.log(process_nlp(sentence));
								console.log(" ");
								console.log(sentence);
								console.log(" ");
								console.log("==================")
							});
							// console.log(process_nlp(sentences[s]));
							// console.log(sentences[s]);
							// console.log(text);
							// console.log("=================");
						}
					}
				});
				// i++;
			// }
			});
		}
	});
	console.log("--------------------------------------------------")
}

// do_request("http://www.bbc.co.uk/news/uk", "http://www.bbc.co.uk", ".faux-block-link__overlay-link", ".story-body__inner");
// do_request("https://www.theguardian.com/uk", "https://www.theguardian.com", ".u-faux-block-link__overlay", ".content__article-body");
// do_request("http://www.reuters.com", "http://www.reuters.com", ".story-title a", "#article-text");
do_request("http://edition.cnn.com", "http://edition.cnn.com", ".cd__headline a", ".l-container")
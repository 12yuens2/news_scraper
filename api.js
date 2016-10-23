var querystring = require("querystring");
var https = require("https");

var host = "api.textrazor.com";

var api_key = "88165ec1a0d94288fce4a214888cd695b38a47f0cf2ec24784ec76fe";

var friends = ["Sizhe Yuen", "Bhargava Jariwala", "Andrew Spence", "Hakkon Thor Brunstad", "James Moran", "Keno Schwalb", "Patrick Schrempf", "Martynas Noreika", "Bipaswi Man Shakya", "Christmas Egle Valkunaite", "Mohammed Saadat"];

var current_requests = 0;

module.exports = {
    change_text: function (text, callback) {
        // if (current_requests === 1) {
        //     sleep.sleep(Math.floor(Math.random() * 10) + 1);
        //     current_requests--;
        // } else {
        //     current_requests++;
        // }
        make_request("POST", text, function(response) {
            if (JSON.parse(response)["response"] != undefined) {
                var entities = JSON.parse(response)["response"]["entities"];

                // console.log(entities);
                text = parse_response(entities, text);
                callback(text);

            } else {
                console.log("too many requests");
                // setTimeout(f(text, callback), 1000);
                callback("");
            }
        });
    }
}


function parse_response(entities, news) {
    var friend_map = [];
    var friend_count = 0;
    for (var i = 0; i<entities.length; i++) {
        var entity = entities[i];
        if (entity["type"]) {
            if (entity["type"].indexOf("Person") > -1) {
                var friend = friends[friend_count];

                if (friend_map[entity["entityId"]]) {
                    friend = friend_map[entity["entityId"]];
                } else {
                    friend_map[entity["entityId"]] = friend;
                    friend_count++;
                }
                news = news.replace(entity["matchedText"], friend);
            }

            if (entity["type"].indexOf("Place") > -1) {
                news = news.replace(entity["matchedText"], "St. AAAAndrews")
            }
        }
    }

    return news;
}


function make_request(method, data, callback) {
    // var data_string = JSON.stringify(data);

    var post_data = querystring.stringify({
        "extractors" : "entities",
        "text" : data
    });

    var headers = {
        "Content-Type" : "application/x-www-form-urlencoded",
        "Content-Length" : Buffer.byteLength(post_data),
        "x-textrazor-key": api_key,
    };

    var options = {
        host: host,
        method: method,
        headers: headers
    };

    var req = https.request(options, function(res) {
       res.setEncoding("utf-8");

        var response = "";

        res.on("data", function(data) {
            response += data;
            // console.log(data);
        });

        res.on("end", function() {
            // console.log(JSON.parse(response));
            callback(response);
            return response;
        });
    });

    req.write(post_data);
    req.end();
}

// var news = "Raine Spencer, stepmother of Diana, Princess of Wales, has died at 87 after a short illness, her family has announced.Countess Spencer died on Friday morning at her London home, her son William Legge, the Earl of Dartmouth and a UKIP MEP, confirmed.Her marriage to Diana's father Earl Spencer from 1976 to 1992 was the second of three in her life.She was the daughter of romance novelist Dame Barbara Cartland.In her early life, she served as a Westminster city councillor from 1954 to 1965.Her first marriage was to the Earl of Dartmouth and lasted from 1948 to 1976.Following the death of Earl Spencer, her second husband, she married Count Jean-Francois de Chambrun in 1993, but the marriage only lasted three years.When she married Earl Spencer and moved into the ancestral home at Althorp, she became stepmother to six-year-old Diana and three-year-old Charles, who now holds his father's title.For many years, she was on the board of directors at department store Harrods.";

function change_text(text) {

}



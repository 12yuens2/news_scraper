var querystring = require("querystring");
var https = require("https");
var fs = require("fs");


//API constants
var host = "api.textrazor.com";
var api_key = "88165ec1a0d94288fce4a214888cd695b38a47f0cf2ec24784ec76fe";


//placeholder facebook friends
var friends = ["Sizhe Yuen", "Bhargava Jariwala", "Andrew Spence", "Hakkon Thor Brunstad", "James Moran", "Keno Schwalb", "Patrick Schrempf", "Martynas Noreika", "Bipaswi Man Shakya", "Christmas Egle Valkunaite", "Mohammed Saadat", "Alex Ungurianu"];


module.exports = {
    /**
     * Function for server to call API.
     * @param text - Text to be processed by the API
     * @param callback - Function that is called after API is returned and text is processed. Parameter of callback is the changed text.
     */
    change_text: function (fb_friends) {
        var friends = get_friends(JSON.parse(fb_friends));

        var articles_json = JSON.parse(fs.readFileSync("articles.json"))
        var processed_json = [];

        for (var i = 0; i < articles_json.length; i++) {
            var article = articles_json[i];
            var processed_article = new Object();

            processed_article.title = article.title;
            processed_article.body = parse_response(article.entities, friends, article.body);

            processed_json.push(processed_article);
        }
        processed_json.sort(function() {
            return 0.5 - Math.random();
        });
        return processed_json;
    },

    request_api: function(text, callback) {
        make_request("POST", text, function(response) {
            if (JSON.parse(response)["response"] != undefined) {
                callback(JSON.parse(response)["response"]["entities"]);
            } else {
                callback("");
            }
        });

    },

}

/**
 * Function that processes the text using information from entities and changes Perons and Places to ones given from Facebook.
 * @param entities - entities in JSON format of TextRazor API
 * @param text - Text to be changed passed on the entities
 * @returns {*} - The changed text
 */
function parse_response(entities, friends, text) {
    var friend_map = [];
    var friend_count = 0;

    for (var i = 0; i<entities.length; i++) {
        var entity = entities[i];
        if (entity["type"]) {
            if (entity["type"].indexOf("Person") > -1) {
                var friend = friends[friend_count];

                if (friend_map[entity["entityId"]]) {
                    console.log("use same friends for " + entity["entityId"] + " : " + friend_map[entity["entityId"]]);
                    friend = friend_map[entity["entityId"]];
                } else {
                    friend_map[entity["entityId"]] = friend;
                    friend_count++;
                    if (friend_count > friends.length) {
                        friends[friend_count] = "NOT_ENOUGH_FRIENDS";
                    }
                }
                text = text.replace(entity["matchedText"], friend);
            }

            if (entity["type"].indexOf("Place") > -1) {
                text = text.replace(entity["matchedText"], "St Andrews")
            }
        }
    }

    return text;
}


function get_friends(fb_friends) {
    var friends = [];
    for (var i = 0; i<fb_friends.length; i++) {
        var friend = fb_friends[i];
        friends.push(friend.first_name + " " + friend.last_name);
    }
    return friends.sort(function() {
        return 0.5 - Math.random();
    });
}

function make_request(method, data, callback) {

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




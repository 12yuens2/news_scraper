var querystring = require("querystring");
var https = require("https");


//API constants
var host = "api.textrazor.com";
var api_key = "88165ec1a0d94288fce4a214888cd695b38a47f0cf2ec24784ec76fe";


//placeholder facebook friends
var friends = ["Sizhe Yuen", "Bhargava Jariwala", "Andrew Spence", "Hakkon Thor Brunstad", "James Moran", "Keno Schwalb", "Patrick Schrempf", "Martynas Noreika", "Bipaswi Man Shakya", "Christmas Egle Valkunaite", "Mohammed Saadat"];


module.exports = {
    /**
     * Function for server to call API.
     * @param text - Text to be processed by the API
     * @param callback - Function that is called after API is returned and text is processed. Parameter of callback is the changed text.
     */
    change_text: function (text, callback) {
        make_request("POST", text, function(response) {
            if (JSON.parse(response)["response"] != undefined) {
                var entities = JSON.parse(response)["response"]["entities"];

                text = parse_response(entities, text);
                callback(text);

            } else {
                //API returned false
                console.log(response);
                callback("");
            }
        });
    },

    update_friends: function(friends_list) {
        friends = friends_list;
    }
}

/**
 * Function that processes the text using information from entities and changes Perons and Places to ones given from Facebook.
 * @param entities - entities in JSON format of TextRazor API
 * @param text - Text to be changed passed on the entities
 * @returns {*} - The changed text
 */
function parse_response(entities, text) {
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
                text = text.replace(entity["matchedText"], friend);
            }

            if (entity["type"].indexOf("Place") > -1) {
                text = text.replace(entity["matchedText"], "St. AAAAndrews")
            }
        }
    }

    return text;
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




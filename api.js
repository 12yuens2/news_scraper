var querystring = require("querystring");
var https = require("https");
var fs = require("fs");


//API constants
var host = "api.textrazor.com";
var api_key = "88165ec1a0d94288fce4a214888cd695b38a47f0cf2ec24784ec76fe";


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


            processed_article.person = friends[i];
            processed_article.title = article.title_entities != undefined ? process_response(article.title_entities, friends, article.title, i) : article.title;
            processed_article.body = article.body_entities != undefined ? process_response(article.body_entities, friends, article.body, i) : article.body;
            console.log(JSON.stringify(processed_article) + "\n\n\n");
            processed_json.push(processed_article);
        }
        processed_json.sort(function() {
            return 0.5 - Math.random();
        });
        return processed_json;
    },

    request_api: function(title, text, callback) {
        make_request("POST", title, function(response) {
            var title_entities = "";
            if (JSON.parse(response)["response"] != undefined) {
                title_entities = JSON.parse(response)["response"]["entities"];
            }
            make_request("POST", text, function(response) {
                var body_entities = "";
                if (JSON.parse(response)["response"] != undefined) {
                    body_entities = JSON.parse(response)["response"]["entities"];
                }
                callback(title_entities, body_entities);
            });
        });
    }

}


function process_response(entities, friends, text, i) {
    var main_friend = "";
    if (i > friends.length) {
        main_friend = "NOT_ENOUGH_FRIENDS!";
    } else {
        main_friend = friends[i];
    }

    var friend_count = 0;
    var friend_map = {};

    var people = [];

    //Go through all person entities and find the one with the highest relevance score
    var main_entity = {"entityId": undefined, "relevanceScore": -1};

    for (var i = 0; i<entities.length; i++) {
        var entity = entities[i];
        if (entity.type && entity.type.indexOf("Person") > -1) {
            people.push(entity);
            if (entity.relevanceScore > main_entity.relevanceScore) {
                main_entity.entityId = entity.entityId;
                main_entity.relevanceScore = entity.relevanceScore;
            }
        }
        if (entity.type && entity.type.indexOf("Place") > -1) {
            text = text.replace(entity.matchedText, "St Andrews");
        }
    }

    // console.log(main_entity.entityId);

    //Put main friend as person with highest relevance
    if (main_entity.entityId != undefined) {
        friend_map[main_entity.entityId] = main_friend;
    }

    //Replace people names with friends' names
    for (var i = 0; i<people.length; i++) {
        var person = people[i];
        var friend = friends[friend_count];

        //if person is already in the friend map
        if (friend_map[person.entityId]) {
            friend = friend_map[person.entityId];
        } else {
            friend_map[person.entityId] = friend;
            friend_count++;
            if (friend_count > friends.length) {
                friends[friend_count] = "NOT_ENOUGH_FRIENDS";
            }
        }
        text = text.replace(person.matchedText, friend);
    }

    return text;
}

/**
 * Function that processes the text using information from entities and changes Persons and Places to ones given from Facebook.
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
        });
    });

    req.write(post_data);
    req.end();
}




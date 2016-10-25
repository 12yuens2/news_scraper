var querystring = require("querystring");
var https = require("https");
var fs = require("fs");


//API constants
var host = "api.textrazor.com";
var api_key = "88165ec1a0d94288fce4a214888cd695b38a47f0cf2ec24784ec76fe";

//Exports for server.js
module.exports = {

    /**
     * Function that changes the articles from 'articles.json' based on Facebook friends.
     * Returns an array of article objects in the form {"person":"", "title":"", "body":""}
     * - "person" is a url taken from 'fb_friends' that links to a person's profile picture.
     *   This field can be empty if list of 'fb_friends' has been exhausted while the list of articles has not been exhausted
     * - "title" is the changed title text of the article
     * - "body" is the changed body text of the article
     * Each article tries to focus on one friend if possible.
     * @param fb_friends - Text to be processed by the API
     * @returns {Array} -  an array of article objects in the form described above
     */
    change_text: function (fb_friends) {
        //Get friends in {"name": "", "img": ""} format from Facebook's objects
        var friends = get_friends(JSON.parse(fb_friends));

        var articles_json = JSON.parse(fs.readFileSync("articles.json"))
        var processed_json = [];

        for (var i = 0; i < articles_json.length; i++) {
            var article = articles_json[i];
            var processed_article = new Object();

            //Add the friend's profile picture to the object
            if (friends[i] != undefined) {
                processed_article.person = friends[i].img;
            }

            /*
             * Add the changed text of the article's title and body text
             * If the API returned no entities, then add the text unchanged
             */
            processed_article.title = article.title_entities != undefined ? process_response(article.title_entities, friends, article.title, i) : article.title;
            processed_article.body = article.body_entities != undefined ? process_response(article.body_entities, friends, article.body, i) : article.body;

            processed_json.push(processed_article);
        }

        //Randomise articles sent
        processed_json.sort(function() {
            return 0.5 - Math.random();
        });

        return processed_json;
    },

    /**
     * Makes two calls to TextRazor API, one for 'title' and one for 'text'.
     * Two responses are returned in the callback which are the entities in JSON format
     * Do not call often as
     * @param title - the title text of the article to be analysed
     * @param text - the body text of the article to be analysed
     * @param callback - the response entities for the title and body are passed to the callback after the API returns its response
     */
    request_api: function(title, text, callback) {
        make_request(title, function(response) {
            var title_entities = "";
            if (JSON.parse(response)["response"] != undefined) {
                title_entities = JSON.parse(response)["response"]["entities"];
            }
            make_request(text, function(response) {
                var body_entities = "";
                if (JSON.parse(response)["response"] != undefined) {
                    body_entities = JSON.parse(response)["response"]["entities"];
                }
                callback(title_entities, body_entities);
            });
        });
    }

}

/**
 * Function that processes the text using information from entities, changing Persons and Places.
 * Tries to focus the text returned on a specific person, namely friends[i].
 * @param entities - the TextRazor entities of the 'text'
 * @param friends - a list of friends that can be used to change the text
 * @param text - the text to be changed
 * @param i - the index for 'friends'
 * @returns {*} - the changed text
 */
function process_response(entities, friends, text, i) {
    var main_friend = "";
    if (friends[i] === undefined) {
        main_friend = "Tim";
    } else {
        main_friend = friends[i].name;
    }

    var friend_count = 0;
    var friend_map = {};

    var people = [];
    var places = [];

    var main_entity = {"entityId": undefined, "relevanceScore": -1};

    //Go through all person entities and find the one with the highest relevance score
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
           places.push(entity);
        }
    }

    //Put main friend as person with highest relevance
    if (main_entity.entityId != undefined) {
        friend_map[main_entity.entityId] = main_friend;
    }

    //Replace people names with friends' names
    for (var i = 0; i<people.length; i++) {
        var person = people[i];
        var friend = "";
        if (friends[friend_count] != undefined) {
            friend = friends[friend_count].name;
        } else {
            friend = "Tim";
        }

        //if person is already in the friend map
        if (friend_map[person.entityId]) {
            friend = friend_map[person.entityId];
        } else {
            friend_map[person.entityId] = friend;
            friend_count++;
            if (friend_count > friends.length) {
                friends[friend_count] = "Tim";
            }
        }
        text = text.replace(person.matchedText, friend);
    }


    var locations = ["St Andrews", "Edinburgh", "Dundee", "North Haugh", "The Scores"];
    var location_map = {};
    var location_count = 0;
    var location = "";
    for (var i = 0; i<places.length; i++) {
        var place = places[i];

        if(locations[location_count] == undefined) {
            location_count = 0;
        }
        location = locations[location_count];

        if (location_map[place.entityId]) {
            location = location_map[place.entityId];
        } else {
            location_map[place.entityId] = location;
            location_count++;
        }
        text = text.replace(place.matchedText, location);

    }

    return text;
}

/**
 * Return an array of friend objects with attributes 'name' and 'img'
 * 'name' is the full name of the friend (first name and last name)
 * 'img' is a link to their Facebook profile picture taken from 'fb_friends'
 * @param fb_friends - array of JSON objects which represent each Facebook friend, its fields are specified in facebook.js
 * @returns {Array.<*>} - a randomised array of friends with their name and link to profile image
 */
function get_friends(fb_friends) {
    var friends = [];
    for (var i = 0; i<fb_friends.length; i++) {
        var friend = fb_friends[i];
        friends.push({"name": friend.first_name + " " + friend.last_name, "img": friend["picture"]["data"].url});
    }

    //Randomise friends list
    return friends.sort(function() {
        return 0.5 - Math.random();
    });
}

/**
 * Makes a HTTPS POST request to the TextRazor API.
 * The response is passed as a parameter to the callback.
 * @param data - the data for the API to process
 * @param callback - the callback function with the API response as its parameter
 */
function make_request(data, callback) {

    //Data of request, as specified by TextRazor's API
    var post_data = querystring.stringify({
        "extractors" : "entities",
        "text" : data
    });

    //Header of request
    var headers = {
        "Content-Type" : "application/x-www-form-urlencoded",
        "Content-Length" : Buffer.byteLength(post_data),
        "x-textrazor-key": api_key,
    };

    var options = {
        host: host,
        method: "POST",
        headers: headers
    };

    var req = https.request(options, function(res) {
       res.setEncoding("utf-8");

        var response = "";

        res.on("data", function(data) {
            response += data;
        });

        res.on("end", function() {
            callback(response);
        });
    });

    req.write(post_data);
    req.end();
}




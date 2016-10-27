var socket = io();
var colSize = 200;
var fbData;


// Accessing the local browser storage and retrieving facebook data
if (typeof(Storage) !== "undefined") {
    socket.emit("generate", localStorage.getItem("friends"));

    fbData = JSON.parse(localStorage.getItem("friends"));
} else {
    console.log("Local storage not supported.");
}

// Getting the response from the server and populating the website with articles and pictures
socket.on('response', function(res){
    articles = [];

    console.log(res);

    // Populating the HTML page with articles
    for (var i = 1; i < 13; i++) {
        var col = document.getElementById("col" + i);

        if (res[i - 1] === undefined)
            continue;

        // Deleting the new line characters from the title
        res[i - 1].title = res[i - 1].title.replace(/\n/g, "");



       // Adding the articles to the carousel in the top
        if (col.id === "col1" || col.id === "col2" || col.id === "col3" || col.id === "col4") {
            // Adding a picture to the article if the it is available
            if (fbData[i - 1] != undefined && res[i - 1].person !== undefined) {
                col.innerHTML =
                    '<img src="' + res[i - 1].person + '" alt="Article picture" class="frontImg">' +
                    "<h4>" + res[i - 1].title + "</h4>" +
                    "<div class='frontText'>" + getIntro(res[i - 1].body) + "</div>" +
                    "<a class='btn btn-default frontButton' onclick='updateArticle(" + i + ")' data-toggle='modal' data-target='#modal' role='button'>Read Article &raquo;</a>";
            }
            else {
                col.innerHTML =
                    "<h4>" + res[i - 1].title + "</h4>" +
                    "<div class='frontText'>" + getIntro(res[i - 1].body) + "</div>" +
                    "<a class='btn btn-default frontButton' onclick='updateArticle(" + i + ")' data-toggle='modal' data-target='#modal' role='button'>Read Article &raquo;</a>";
            }

        }
        // Adding the articles to columns in the container layout
        else {
            // Adding a picture to the article if the it is available
            if (fbData[i - 1] != undefined && res[i - 1].person !== undefined) {
                col.innerHTML =
                    '<div class="box"><a style="color:inherit;" onclick="updateArticle(' + i + ')" data-toggle="modal" data-target="#modal" role="button"><img src="' + res[i - 1].person + '" alt="Article picture" class="frontImg">' +
                    "<h5>" + getHeadline(res[i - 1].title) + "</h5>" +
                    "<div class='colText' >" + getIntro(res[i - 1].body) + "</div></a></div>" ;
            }
            else {
                col.innerHTML =
                    "<h5>" + getHeadline(res[i - 1].title) + "</h5>" +
                    "<p>" + getIntro(res[i - 1].body) + "</p>" +
                    "<p><a class='btn btn-default' onclick='updateArticle(" + i + ")' data-toggle='modal' data-target='#modal' role='button'>Read Article &raquo;</a></p>";
            }

        }

        // Storing the articles in order to be able to show them in full later on
        if (res[i - 1].person === undefined)
            articles[i] = {"title": res[i - 1].title, "body": res[i - 1].body};
        else
            articles[i] = {"title": res[i - 1].title, "body": res[i - 1].body, "person": res[i - 1].person};
    }

    // Disconnecting from the server after the request is made
    socket.disconnect();
});

/**
 * Makes a short description of an article
 * @param article
 * @returns {string}
 */
function getIntro(article) {
    var intro = article.substring(0, colSize);
    var index = intro.length;

    if (index <= 0)
        return;

    while (!/\s/.test(intro.charAt(index))) {
        intro = intro.substring(0, index);

        index--;
    }

    return intro + "...";
}

/**
 * Updates the modal in the website that displays the articles
 * @param index
 */
function updateArticle(index) {
    if (articles[index].person != undefined) {
        document.getElementById('modalBody').innerHTML=
            '<img src="' + articles[index].person + '" id="article-image">' +
            '<p id="article-text">' +
            formatText(articles[index].body) +
            '</p>';
    }
    else {
        document.getElementById('modalBody').innerHTML=
            '<p id="article-text">' +
            formatText(articles[index].body) +
            '</p>';
    }

    document.getElementById('article-title').innerText = articles[index].title;

}

/**
 * Formatting the article text: deleting multiple new line characters and others
 * @param article
 * @returns {string}
 */
function formatText(article) {
    var formattedText = "";

    for (var i = 0; i < article.length; i++) {
        if (article.charAt(i) === '\n' || article.charAt(i + 1) === '<br>')
            if (i + 1 != article.length && article.charAt(i + 1) === '<br>' || article.charAt(i + 1) === '\n')
                formattedText += '';
            else
                formattedText += '<br><br>';
        else  if (article.charAt(i) === '\r')
                formattedText += '';
        else
            formattedText += article.charAt(i);
    }


    return formattedText;
}

/**
 * Formatting the headline: deleting new line characters from it
 * @param headline
 * @returns {*}
 */
function getHeadline(headline) {
    if (headline.length < 81)
        return headline;

    var intro = headline.substring(0, 81);
    var index = intro.length;

    if (index <= 0)
        return;

    while (!/\s/.test(intro.charAt(index))) {
        intro = intro.substring(0, index);

        index--;
    }

    return intro;
}

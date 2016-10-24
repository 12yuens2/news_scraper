var socket = io();
var colSize = 200;
var fbData;

//socket.emit("generate");

if (typeof(Storage) !== "undefined") {
    socket.emit("generate", localStorage.getItem("friends"));

    fbData = JSON.parse(localStorage.getItem("friends"));
    console.log(fbData);
} else {
    console.log("Local storage not supported.");
}


socket.on('response', function(res){
    articles = [];

    // Populating the HTML page with articles
    for (var i = 1; i < 13; i++) {
        var col = document.getElementById("col" + i);

        res[i - 1].title = res[i - 1].title.replace(/\n/g, "");
        //res[i - 1].body = res[i - 1].body.replace(/\n/g, "");

        if (res[i - 1] === undefined)
            continue;

        if (col.id === "col1" || col.id === "col2" || col.id === "col3" || col.id === "col4") {
            col.innerHTML =
                '<img src="' + fbData[i - 1]['picture'].data.url + '" alt="Article picture" class="frontImg">' +
                "<h4>" + res[i - 1].title + "</h4>" +
                "<div class='frontText'>" + getIntro(res[i - 1].body) + "</div>" +
		        "<a class='btn btn-default frontButton' onclick='updateArticle(" + i + ")' data-toggle='modal' data-target='#modal' role='button'>Read Article &raquo;</a>";

        }
        else {
            if (fbData[i - 1] != undefined) {
                col.innerHTML =
                    '<div class="box"><a style="color:inherit;" onclick="updateArticle(' + i + ')" data-toggle="modal" data-target="#modal" role="button"><img src="' + fbData[i - 1]['picture'].data.url + '" alt="Article picture" class="frontImg">' +
                    "<h5>" + getHeadline(res[i - 1].title) + "</h5>" +
                    "<div class='colText' >" + getIntro(res[i - 1].body) + "</div></a></div>" //+
                    // "<p><a class='btn btn-default btnInText' onclick='updateArticle(" + i + ")' data-toggle='modal' data-target='#modal' role='button'>Read Article &raquo;</a></p></div>";
            }
            else {
                col.innerHTML =
                    "<h5>" + getHeadline(res[i - 1].title) + "</h5>" +
                    "<p>" + getIntro(res[i - 1].body) + "</p>" +
                    "<p><a class='btn btn-default' onclick='updateArticle(" + i + ")' data-toggle='modal' data-target='#modal' role='button'>Read Article &raquo;</a></p>";
            }

        }


        articles[i] = {"title": res[i - 1].title, "body": res[i - 1].body};
    }

    socket.disconnect();
});

// Makes an short description of an article
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

function updateArticle(index) {
    document.getElementById('article-title').innerText = articles[index].title;
    document.getElementById('article-text').innerText = formatText(articles[index].body);

}

function formatText(article) {
    var formattedText = "";

    for (var i = 0; i < article.length; i++) {
        if (article.charAt(i) === '\n')
            formattedText += '\n\n';
        else
            formattedText += article.charAt(i);
    }

    return formattedText;
}

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

var socket = io();
var colSize = 231;
var fbData;

//socket.emit("generate");

if (typeof(Storage) !== "undefined") {
    socket.emit("generate", localStorage.getItem("friends"));

    fbData = JSON.parse(localStorage.getItem("friends"));
} else {
    console.log("Local storage not supported.");
}


socket.on('response', function(res){
    articles = [];

    // Populating the HTML page with articles
    for (var i = 1; i < 10; i++) {
        var col = document.getElementById("col" + i);

        res[i - 1].title = res[i - 1].title.replace(/\n/g, "");
        res[i - 1].body = res[i - 1].body.replace(/\n/g, "");

        if (res[i - 1] === undefined)
            continue;

        if (col.id === "col1") {
            col.innerHTML =
                '<img src="' + fbData[0]['picture'].data.url + '" alt="Article picture" class="frontImg">' +
                "<h4>" + res[i - 1].title + "</h4>" +
                "<p class='frontText'>" + getIntro(res[i - 1].body) + "</p>" +
                "<p><a class='btn btn-default' onclick='updateArticle(" + i + ")' data-toggle='modal' data-target='#modal' role='button'>Read Article &raquo;</a></p>";

        }

        else
            col.innerHTML =
                "<h4>" + res[i - 1].title + "</h4>" +
                "<p>" + getIntro(res[i - 1].body) + "</p>" +
                "<p><a class='btn btn-default' onclick='updateArticle(" + i + ")' data-toggle='modal' data-target='#modal' role='button'>Read Article &raquo;</a></p>";

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
    document.getElementById('article-text').innerText = articles[index].body;

}

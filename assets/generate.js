var socket = io();
var colSize = 231;
var friends;

//socket.emit("generate");

if (typeof(Storage) !== "undefined") {
    socket.emit("generate", localStorage.getItem("friends"));
} else {
    console.log("Local storage not supported.");
}


socket.on('response', function(res){
    articles = [];

    // Populating the HTML page with articles
    for (var i = 1; i < 8; i++) {
        var col = document.getElementById("col" + i);

        if (res[i - 1] === undefined)
            continue;

        col.innerHTML =
            "<h4><b>" + res[i - 1].title + "</b></h4>" +
            "<p>" + getIntro(res[i - 1].body) + "</p>" +
            "<p><a class='btn btn-default' onclick='updateArticle(" + i + ")' data-toggle='modal' data-target='#modal' role='button'>Read Article &raquo;</a></p>";

        articles[i] = {"title": res[i - 1].title, "body": res[i - 1].body};
    }

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

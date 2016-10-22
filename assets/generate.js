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


    // Populating the HTML page with articles
    for (var i = 1; i < 8; i++) {
        var col = document.getElementById("col" + i);

        col.innerHTML =
            "<h4><b>" + res[i - 1].title + "</b></h4>" +
            "<p>" + getIntro(res[i - 1].body) + "</p>" +
            "<p><a class='btn btn-default' href='#' role='button'>Read Article &raquo;</a></p>";
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

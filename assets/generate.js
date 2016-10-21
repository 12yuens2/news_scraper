var socket = io(); // your initialization code here.
var colSize = 231;


socket.emit('generate');

socket.on('response', function(res){
    console.log(res[0].title);


    for (var i = 1; i < 8; i++) {
        var col = document.getElementById("col" + i);

        col.innerHTML =
            "<h4><b>" + res[i - 1].title + "</b></h4>" +
            "<p>" + res[i - 1].body.substring(0, colSize - 3) + " ...</p>" +
            "<p><a class='btn btn-default' href='#' role='button'>Read Article &raquo;</a></p>";
    }
});


function replaceLastWord(string) {
    for (var i = 0; i < string.length; i++) {

    }
}
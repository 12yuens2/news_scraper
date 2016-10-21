var socket = io(); // your initialization code here.

socket.emit('generate');

socket.on('response', function(res){
    console.log("Heelo");

    for (var i = 1; i < 7; i++) {
        var col = document.getElementById("col" + i);

        console.log("col" + i);

        col.innerHTMl = "<a>Hey</a>";
    }
});
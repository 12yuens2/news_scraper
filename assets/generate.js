var socket = io();
var colSize = 231;
var friends;
//profile photo url can be accessed by: friend.picture.data.url

logIn();
console.log(friends);

socket.emit('generate', friends);

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

    while (!/\s/.test(intro.charAt(index))) {
        intro = intro.substring(0, index);

        index--;
    }

    return intro + "...";
}

function logIn() {
  FB.login(function(response) {
    // if permission given
    if (response.authResponse) {
      FB.api('/me?', {fields: 'id, gender, first_name, last_name, email, likes, age_range, birthday, picture.width(100).height(100)'}, function(response) {
        //initiate array with user's object
        friends = new Array(JSON.stringify(response));
        //add user's friends to the array
        addFriends();
      });
    } else {
      console.log('User cancelled login or did not fully authorize.');
    }
  }, {scope:'email,  user_friends, user_photos'}); //ask user to access their details
}

//add all friends to friends array
function addFriends(){
  FB.api("/me/friends", {fields: 'id, gender, first_name, last_name, email, likes, age_range, birthday, picture.width(100).height(100)'},  function(response) {
    response.data.forEach(function(friend) {
      friends.push(JSON.stringify(friend));
    });
  });
  // console.log(friends);
}

var socket = io(); // your initialization code here.
var colSize = 231;
var friends;
//profile photo url can be accessed by: friend.picture.data.url

logIn();
console.log(friends);

socket.emit('generate', friends);

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

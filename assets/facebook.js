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

    if (typeof(Storage) !== "undefined") {
        localStorage.setItem("friends", friends);
        console.log("Local storage set.");

        window.location = "gen.html";
    } else {
        console.log("Local storage not supported.");
    }
}
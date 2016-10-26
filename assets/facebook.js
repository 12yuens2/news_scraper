friends = [];

/**
 * Allows basic user log-in and adds user to friends array.fields section
 * specifies which information is being accessed. scope section specifies with which
 * permissions user will ba asked to agree with.
 */
function logIn() {
    FB.login(function(response) {
        // if permission given
        if (response.authResponse) {
            FB.api('/me?', {fields: 'id, gender, first_name, last_name, email, likes, age_range, birthday, picture.width(100).height(100)'}, function(response) {
                //initiate array with user's object
                friends.push(response);
                //add user's friends to the array
                addFriends();
            });
        } else {
            console.log('User cancelled login or did not fully authorize.');
        }
    }, {scope:'email,  user_friends, user_photos'}); // ask user to access their details
}

/**
 * Adds user friends that use the application to friends array. fields section
 * specifies which information is being accessed.
 */
function addFriends(){
    FB.api("/me/friends", {fields: 'id, gender, first_name, last_name, email, likes, age_range, birthday, picture.width(100).height(100)'},  function(response) {
        response.data.forEach(function(friend) {
            friends.push(friend);

            if (typeof(Storage) !== "undefined") {
                localStorage.setItem("friends", JSON.stringify(friends));
            } else {
                console.log("Local storage not supported.");
            }
        });

       window.location = "gen.html";
    });
}

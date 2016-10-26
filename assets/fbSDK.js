/**
 * The following two snippets of code load and initialise
 * Facebook SDK.
 */
window.fbAsyncInit = function() {
  FB.init({
    appId      : '663533450471602',
    channelUrl : 'https://mn55.host.cs.st-andrews.ac.uk',
    xfbml      : true,
    version    : 'v2.8'
  });

  FB.getLoginStatus(function(response)){
    // add global var to know that it is initialised
    loaded = true;
  });
};

(function(d, s, id){
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) {return;}
  js = d.createElement(s); js.id = id;
  js.src = "https://connect.facebook.net/en_US/sdk.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

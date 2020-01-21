
$(document).ready(function() {
    if (document.cookie) {
        document.cookie = "numVisits=" + (parseInt(document.cookie.split("=")[1]) + 1) + "; expires=Fri, 29 Dec 2069 12:00:00 UTC";
    } else {
        document.cookie = "numVisits=1; expires=Fri, 29 Dec 2069 12:00:00 UTC";
    }

    $("#num-visited").text(document.cookie.split("=")[1]);

    var neonBuzz = new Audio("../audio/neonBuzz.mp3");
    neonBuzz.play();
});

function returnCookies() {
    var cookies=[];
    var cookiesArray = document.cookie.split('; ');
    for(var i = 0; i < cookiesArray.length; i++) {
        var cookie = cookiesArray[i].split("=");
        cookies[cookie[0]] = cookie[1];
    }
    return cookies;
}

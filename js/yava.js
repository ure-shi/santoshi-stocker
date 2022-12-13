function hasGetUserMedia() {
    return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

var errorCallback = function(e) {
    console.log('Reeeejected!', e);
};

if (hasGetUserMedia()) {
    navigator.getUserMedia({video: true, audio: true}, function(localMediaStream) {
        var video = document.querySelector('video');
        video.src = window.URL.createObjectURL(localMediaStream);

        video.onloadedmetadata = function(e) {

        };
    }, errorCallback);
} else {
    alert("No getUserMedia")
}

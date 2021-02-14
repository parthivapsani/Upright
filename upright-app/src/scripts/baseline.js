const camera = document.querySelector('#camera');

navigator.mediaDevices.getUserMedia({
        video: true
    })
    .then(function (stream) {
        if (!stream.getVideoTracks().length) {
            throw new Error("Device does not have webcam");
        }
        camera.srcObject = stream;

    }).catch(function (error) {
        console.log(error);
        alert('Could not connect stream.');
    });
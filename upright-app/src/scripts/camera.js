import { process, writeToFile } from './process.js';

let pictureInterval = 3000;

navigator.mediaDevices.getUserMedia({
    video: true
}).then(function (stream) {
    if (!stream.getVideoTracks().length) {
        throw new Error("Device does not have webcam");
    }
    document.getElementById('camera').srcObject = stream;
    setInterval(() => {
        process(stream, pictureInterval)
    }, pictureInterval);
}).catch(function (e) {
	console.log(e)
    alert('Could not connect stream');
});

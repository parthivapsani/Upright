import { process } from './process.js';

var canvas = document.querySelector('canvas');

navigator.mediaDevices.getUserMedia({video: true})
  .then(function(stream) {
    if (!stream.getVideoTracks().length) {
        throw new Error("Device does not have webcam");
    }
    document.getElementById('camera').srcObject = stream;
    process(stream, canvas);

  }).catch(function() {
    alert('could not connect stream');
  });
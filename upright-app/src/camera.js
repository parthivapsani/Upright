import { process } from './process.js';

navigator.mediaDevices.getUserMedia({video: true})
  .then(function(stream) {
    document.getElementById('camera').srcObject = stream;
    process(stream);

  }).catch(function() {
    alert('could not connect stream');
  });
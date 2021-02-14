const {
  ipcRenderer
} = require('electron');

import {
  process,
  writeToFile
} from './process.js';
import {
  uploadSlouchToFirestore
} from './firebase/firestore.js';

const helpButton = document.querySelector('#help-btn');

navigator.mediaDevices.getUserMedia({
    video: true
  })
  .then(function (stream) {
    if (!stream.getVideoTracks().length) {
      throw new Error("Device does not have webcam");
    }
    document.getElementById('camera').srcObject = stream;
    setInterval(() => {
      process(stream, canvas)
    }, 3500);
  }).catch(function (e) {
    console.log(e)
    alert('could not connect stream');
  });

helpButton.addEventListener('click', function () {
  ipcRenderer.send('helper-open');
});
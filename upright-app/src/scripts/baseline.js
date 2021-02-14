const {
    ipcRenderer
} = require('electron');

import { computeBaseline } from './process.js';

const camera = document.querySelector('#camera');
const doneButton = document.querySelector('#done');

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

doneButton.addEventListener('click', function() {
    computeBaseline(camera.srcObject, function(baseline) {
        ipcRenderer.send('baseline-complete', baseline);
    });
})
const {
    ipcRenderer
} = require('electron');

import {
    process
} from './process.js';

const helpButton = document.querySelector('#help-btn');
const display = document.querySelector('#display');
let pictureInterval = 3000;

navigator.mediaDevices.getUserMedia({
    video: true
}).then(function (stream) {
    if (!stream.getVideoTracks().length) {
        throw new Error("Device does not have webcam");
    }
    document.getElementById('camera').srcObject = stream;
    setInterval(() => {
        process(stream, pictureInterval, display);
    }, pictureInterval);
}).catch(function (e) {
    console.log(e)
    // alert('could not connect stream');
});

helpButton.addEventListener('click', function () {
    ipcRenderer.send('settings-open');
});
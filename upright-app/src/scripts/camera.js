const {
    ipcRenderer
} = require('electron');

import {
    process
} from './process.js';
import {
    uploadSlouchToFirestore
} from './firebase/firestore.js';

const helpButton = document.querySelector('#help-btn');
let pictureInterval = 3000;
let firestoreData = {"slouch": false};

navigator.mediaDevices.getUserMedia({
    video: true
}).then(function (stream) {
    if (!stream.getVideoTracks().length) {
        throw new Error("Device does not have webcam");
    }
    document.getElementById('camera').srcObject = stream;
    setInterval(() => {
        firestoreData = process(stream, pictureInterval);
        // console.log(firestoreData);
        if (firestoreData["slouch"]) {
            uploadSlouchToFirestore(firestoreData["uid"], firestoreData["data"]);
            // console.log("Uploaded to firestore");
        }
    }, pictureInterval);
}).catch(function (e) {
    console.log(e)
    alert('could not connect stream');
});

helpButton.addEventListener('click', function () {
    ipcRenderer.send('helper-open');
});
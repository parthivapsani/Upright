const {
    ipcRenderer
} = require('electron');

const eyeDistanceRadio = document.querySelector('#eyeDistance');
const eyeShoulderRatioRadio = document.querySelector('#eyeShoulderRatio');
const resetBaselinesButton = document.querySelector('#resetBaselines');

const sensitivityHeader = document.querySelector('#sensitivityHeader');
const sensitivitySlider = document.querySelector('#sensitivity');
const confidenceHeader = document.querySelector('#confidenceHeader');
const confidenceSlider = document.querySelector('#confidence');
const fpsHeader = document.querySelector('#fpsHeader');
const fpsSlider = document.querySelector('#fps');

const cooldownHeader = document.querySelector('#cooldownHeader');
const cooldownSlider = document.querySelector('#cooldown');

const soundSwitch = document.querySelector('#sound');
const outOfFrameSwitch = document.querySelector('#outOfFrame');

var userData = {};

ipcRenderer.on('userData2', function (event, data) {
    userData = data;
    setHTMLValues();
});

function setHTMLValues() {
    eyeDistanceRadio.checked = userData.detectionType == 'eyeDistance';
    eyeShoulderRatioRadio.checked = userData.detectionType == 'eyeShoulderRatio';

    sensitivityHeader.innerHTML = `Sensitivity: ${userData.sensitivity}%`;
    sensitivitySlider.value = userData.sensitivity;

    confidenceHeader.innerHTML = `Confidence: ${userData.confidence}%`;
    confidenceSlider.value = userData.confidence;

    fpsHeader.innerHTML = `FPS: ${userData.fps}`;
    fpsSlider.value = userData.fps;

    cooldownHeader.innerHTML = `Cooldown: ${userData.cooldown} seconds`;
    cooldownSlider.value = userData.cooldown;

    soundSwitch.checked = userData.sound;
    outOfFrameSwitch.checked = userData.outOfFrame;
}

function saveData() {
    console.log('save data');
    ipcRenderer.send('update-user-data', userData);
}

sensitivitySlider.onchange = saveData;
sensitivitySlider.oninput = function() {
    userData.sensitivity = sensitivitySlider.value;
    sensitivityHeader.innerHTML = `Sensitivity: ${userData.sensitivity}%`;
}

confidenceSlider.onchange = saveData;
confidenceSlider.oninput = function() {
    userData.confidence = confidenceSlider.value;
    confidenceHeader.innerHTML = `Confidence: ${userData.confidence}%`;
}

fpsSlider.onchange = saveData;
fpsSlider.oninput = function() {
    userData.fps = fpsSlider.value;
    fpsHeader.innerHTML = `FPS: ${userData.fps}`;
}
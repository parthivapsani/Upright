const {
    ipcRenderer,
    remote
} = require('electron');

// import { uploadSlouchToFirestore } from './firebase/firestore.js';


let net;
let jsonData = {};
let filename = "poseData.json";
let keypointIndices = [1, 2, 5, 6];

//from 0 to 1
//0 means it'll say ur always slouching
//1 means you'll basically never be slouching
const sensitivity = 0.09;
const confidenceMinimum = 0.3;
const frameGap = 20;

let baseline = null;
let UID = null;
let lastNotificationClose = 0;
let lastPostureTime = 0;
let notificationDisplayed = false;
let notification = null;
let firestoreData = {"slouch": false};

ipcRenderer.on('userData', function (event, userData) {
    baseline = userData.baseline;
    UID = userData.uid;
});

function getRatio(pose) {
    let eye_l = pose["keypoints"][1]["position"];
    let eye_r = pose["keypoints"][2]["position"];
    let eyeWidth = dist(eye_l['x'], eye_l['y'], eye_r['x'], eye_r['y']);

    let shoulder_l = pose["keypoints"][5]["position"];
    let shoulder_r = pose["keypoints"][6]["position"];
    let shoulderWidth = dist(shoulder_l['x'], shoulder_l['y'], shoulder_r['x'], shoulder_r['y']);

    let ratio = eyeWidth / shoulderWidth;
    return ratio;
}

function getSlouchConfidence(pose) {
    let confidenceOfSlouch = 1;
    for (let i = 0; i < keypointIndices.length; ++i) {
        confidenceOfSlouch = Math.min(confidenceOfSlouch, pose["keypoints"][keypointIndices[i]]["score"]);
    }
    return confidenceOfSlouch;
}

async function getBaseline(image, completion) {
    let pose = await net.estimateSinglePose(image);
    let confidenceOfSlouch = getSlouchConfidence(pose);

    // Less likely than 30% that all of the keypoints were mapped
    if (confidenceOfSlouch <= confidenceMinimum) {
        console.log("Image does not have necessary keypoints visible");
        return;
    }

    baseline = getRatio(pose);
    completion(baseline);
}

function computeBaseline(stream, completion) {
    const track = stream.getVideoTracks()[0];
    let imageCapture = new ImageCapture(track);
    imageCapture.grabFrame().then(imageBitmap => {
        getBaseline(imageBitmap, completion);
    }).catch(err => console.error('Compute baseline failed: ', err));
}

function dist(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
}

async function startup() {
    net = await posenet.load();
}

async function estimate(image, interval) {
    let pose = await net.estimateSinglePose(image);
    let confidenceOfSlouch = getSlouchConfidence(pose);
    let time = new Date();

    // Less likely than 30% that any of the 
    if (confidenceOfSlouch <= confidenceMinimum) {
        if (notificationDisplayed && (time.getTime() - lastNotificationClose) > frameGap * interval &&
            (time.getTime() - lastPostureTime) > frameGap * interval) {
            console.log("User notification is stale and has been removed");
            notification.close();
            notificationDisplayed = false;
            lastNotificationClose = time.getTime();
        }
        console.log("Image does not have necessary keypoints visible");
        firestoreData = {"slouch": false};
    }

    let ratio = getRatio(pose);
    let percentSlouch = 0;
    lastPostureTime = time.getTime();

    percentSlouch = Math.max(Math.abs((ratio - baseline * (1 + sensitivity))),
        Math.abs((baseline * (1 - sensitivity) - ratio))) * 1000;

    // If user is detected to be slouching
    if (ratio > baseline * (1 + sensitivity) || ratio < baseline * (1 - sensitivity)) {
        percentSlouch = Math.min(99, percentSlouch + 30);
        console.log("You're slouching");
        if (!notificationDisplayed && (time.getTime() - lastNotificationClose) > frameGap * interval) {
            notificationDisplayed = true;
            let roundedSlouchPercent = Math.round(percentSlouch);
            notification = new Notification('Sit Upright!',
                {body: `You're slouching ${roundedSlouchPercent}%, sit up for better posture!`,
                hasReply: true,
                timeoutType: 'never'});
            notification.onclick = () => {
                notificationDisplayed = false;
                lastNotificationClose = time.getTime();
                console.log("Notification closed");
            }
        }
    }
    // Otherwise, close the notification if the user is no longer slouching
    else {
        if (notificationDisplayed) {
            notificationDisplayed = false;
            notification.close();
            lastNotificationClose = time.getTime();
        }
    }

    console.log(percentSlouch + "% slouch");

    let slouchData = {
        "slouch-confidence": confidenceOfSlouch,
        "slouch-percent": percentSlouch,
        "time": time.getTime()
    };

    firestoreData = {"uid": UID, "data": slouchData, "slouch": true};
}

function process(data, interval) {
    const track = data.getVideoTracks()[0];
    let imageCapture = new ImageCapture(track);
    imageCapture.grabFrame().then(imageBitmap => {
        estimate(imageBitmap, interval);
    }).catch(err => console.error('process failed: ', err));
    return firestoreData;
}

function makeFile() {
    let blob = new Blob([JSON.stringify(jsonData, undefined, 4)], {
        type: 'application/json'
    });
    return window.URL.createObjectURL(blob)
}

function writeToFile(document, window) {
    let link = document.createElement('a');
    link.setAttribute('download', filename);
    link.href = makeFile(window);
    document.body.appendChild(link);
    window.requestAnimationFrame(function () {
        let event = new MouseEvent('click');
        link.dispatchEvent(event);
        document.body.removeChild(link);
    });
}

startup();

export {
    process,
    writeToFile,
    computeBaseline
}
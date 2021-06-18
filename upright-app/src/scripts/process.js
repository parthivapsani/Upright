const {
    ipcRenderer
} = require('electron');

let net;
let jsonData = {};
let filename = "poseData.json";
let keypointIndices = [1, 2, 5, 6];

let messageList = [
    "Your posture is awful please fix it thanks :)",
    "Hey - You! Your spine looks like a sad Twizzler. It'd be great if you made it do not that!",
    "You won't be able to run away from your responsibilities with that posture - sit upright!",
    // "Bro. Dudette. Non-binary individual. You've got the posture of a soggy potato chip. Sit upright!",
    "Your back is as straight as a circle right now, sit upright!"
]

//from 0 to 1
//0 means it'll say ur always slouching
//1 means you'll basically never be slouching
var sensitivity = 0.09;
var confidenceMinimum = 0.3;
var frameGap = 3;

let baseline = null;
let lastNotificationClose = 0;
let lastPostureTime = 0;
let notificationDisplayed = false;
let lastNotificationTime = new Date();
let minimumNotificationTime = 9000;
let withSound = true;
let notification = null;
let messageIndex;
let display = null;

ipcRenderer.on('userData', function (event, userData) {
    console.log('got new user data: ', userData);
    baseline = userData.baseline;
    sensitivity = userData.sensitivity / 100.0;
    confidenceMinimum = userData.confidence / 100.0;
    // frameGap = userData.fps; // not using FPS
    minimumNotificationTime = userData.cooldown * 1000.0;
    withSound = userData.sound;
    console.log('set cooldown to ', minimumNotificationTime);
});

//valid value is from 0 to 1
//but it makes sense to keep it capped from like 0.03ish to 0.2ish
function updateSensitivity(s){
	sensitivity = s;
}

//minimum amount of percentage needed for posenet prediction
//valid value is from 0 to 1
//but it makes sense to keep it capped from like 0.1 to .95
function updateConfidence(c){
	confidenceMinimum = c;
}

//keep in mind for future: what if fps differs across devices
function updateFrameGap(f){
	frameGap = f;
}

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
    messageIndex = Math.floor(Math.random() * messageList.length);
}

async function estimate(image, interval) {
    let pose = await net.estimateSinglePose(image);
    let confidenceOfSlouch = getSlouchConfidence(pose);
    let time = new Date();

    // Less likely than 30% that any of the 
    if (confidenceOfSlouch <= confidenceMinimum) {
        if (notificationDisplayed && (time - lastNotificationClose) > frameGap * interval &&
            (time - lastPostureTime) > frameGap * interval && 
            (time - lastNotificationTime) > frameGap * interval) {
            console.log("User notification is stale and has been removed");
            notification.close();
            notificationDisplayed = false;
            lastNotificationClose = time;
        }
        console.log("Image does not have necessary keypoints visible");
    }

    let ratio = getRatio(pose);
    let percentSlouch = 0;
    lastPostureTime = time;

    percentSlouch = Math.max(Math.abs((ratio - baseline * (1 + sensitivity))),
        Math.abs((baseline * (1 - sensitivity) - ratio))) * 1000;

    // If user is detected to be slouching
    // if (confidenceOfSlouch > confidenceMinimum && (ratio > baseline * (1 + sensitivity) || ratio < baseline * (1 - sensitivity))) {
    if (ratio > baseline * (1 + sensitivity) || ratio < baseline * (1 - sensitivity)) {
        percentSlouch = Math.min(99, percentSlouch + 30);
        console.log("You're slouching");
        console.log("time since last notification: ", (time - lastNotificationTime));
        console.log("minimum time: ", minimumNotificationTime);
        console.log("notification displayed: ", notificationDisplayed);
        display.innerHTML = `You're slouching — sit upright!`;
        // For now, I'm taking out the check for !notificationDisplayed since if a user swipes to 
        // dismiss a notification, notificationDisplayed is not updated.
        if ((time - lastNotificationTime) > minimumNotificationTime) {
            notificationDisplayed = true;
            lastNotificationTime = time;
            notification = new Notification('Sit Upright!',
                {body: messageList[messageIndex++],
                hasReply: true,
                timeoutType: 'never',
                icon: "../assets/medium_letter.png",
                silent: !withSound});
            messageIndex %= messageList.length;
            notification.onclick = () => {
                notificationDisplayed = false;
                lastNotificationTime = 0;
                lastNotificationClose = time;
                console.log("Notification closed");
            }
            notification.addEventListener('close', (event) => {
                notificationDisplayed = false;
                lastNotificationTime = 0;
                lastNotificationClose = time;
                console.log("Notification closed3");
            });
            notification.onclose = (event) => {
                notificationDisplayed = false;
                lastNotificationTime = 0;
                lastNotificationClose = time;
                console.log("Notification closed2");
            }
        }
    }
    // Otherwise, close the notification if the user is no longer slouching
    else {
        console.log("You're not slouching");
        display.innerHTML = `Great posture!`;
        if (notification != null) {
            notificationDisplayed = false;
            notification.close();
            lastNotificationClose = time;
        }
    }

    console.log(percentSlouch + "% slouch");

    let slouchData = {
        "slouch-confidence": confidenceOfSlouch,
        "slouch-percent": percentSlouch,
        "time": time
    };
}

function process(data, interval, displayElement) {
    display = displayElement;
    const track = data.getVideoTracks()[0];
    let imageCapture = new ImageCapture(track);
    imageCapture.grabFrame().then(imageBitmap => {
        estimate(imageBitmap, interval);
    }).catch(err => console.error('process failed: ', err));
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
    computeBaseline,
	updateSensitivity,
	updateConfidence,
	updateFrameGap
}

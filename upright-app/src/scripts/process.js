const {
    ipcRenderer,
    remote
} = require('electron');

let net;
let jsonData = {};
let filename = "poseData.json";
let id = 0;
let keypointIndices = [1, 2, 5, 6];

//from 0 to 1
//0 means it'll say ur always slouching
//1 means you'll basically never be slouching
const sensitivity = 0.09;
const confidenceMinimum = 0.3;

let baseline = null;

ipcRenderer.on('userData', function (event, userData) {
    console.log('Got user data in process.js ', userData);
    baseline = userData.baseline;
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

async function getBaseline(image, completion) {
    let pose = await net.estimateSinglePose(image);

    let confidenceOfSlouch = 1;
    for (let i = 0; i < keypointIndices.length; ++i) {
        confidenceOfSlouch = Math.min(confidenceOfSlouch, pose["keypoints"][keypointIndices[i]]["score"]);
    }
    // Less likely than 30% that any of the 
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
            // console.log('Frame grabbed: ', imageBitmap);
            getBaseline(imageBitmap, completion);
        })
        .catch(err => console.error('Compute baseline failed: ', err));
}


function dist(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
}

async function startup() {
    net = await posenet.load();
}

async function estimate(image) {
    let pose = await net.estimateSinglePose(image);
    let d = new Date();
    console.log(pose);
    console.log(d.toString());
    let jsonObject = {
        "score": pose["score"],
        "time": d.toString()
    };
    let keypoints = [];
    let confidenceOfSlouch = 1;
    for (let i = 0; i < keypointIndices.length; ++i) {
        keypoints.push(pose["keypoints"][keypointIndices[i]]);
        confidenceOfSlouch = Math.min(confidenceOfSlouch, pose["keypoints"][keypointIndices[i]]["score"]);
    }
    // Less likely than 30% that any of the 
    if (confidenceOfSlouch <= confidenceMinimum) {
        return;
    }
    jsonObject["keypoints"] = keypoints;

    let ratio = getRatio(pose);

    if (baseline === null) {
        baseline = ratio;
    }

    console.log("slouch index:");
    console.log(ratio);
    console.log(baseline);
    // console.log(Math.abs((ratio - baseline)));

    let percentSlouch = 0;

    if (ratio > baseline * (1 + sensitivity) || ratio < baseline * (1 - sensitivity)) {
        console.log("you're slouching")
        // console.log((ratio - baseline * (1 + sensitivity)) * 1000);
        // console.log((baseline * (1 - sensitivity) - ratio) * 1000);
        percentSlouch = Math.max(Math.abs((ratio - baseline * (1 + sensitivity))),
            Math.abs((baseline * (1 - sensitivity) - ratio))) * 1000;
        percentSlouch = Math.min(99, percentSlouch + 30);
    }
    if (percentSlouch === 0) {
        return;
    }
    console.log(percentSlouch + "% slouch");
    let slouchData = {
        "slouch-confidence": confidenceOfSlouch,
        "slouch-percent": percentSlouch,
        "time": d.toString()
    };
    jsonData[id++] = jsonObject;
    return slouchData;
}

function process(data, canvas) {
    const track = data.getVideoTracks()[0];
    let imageCapture = new ImageCapture(track);
    imageCapture.grabFrame().then(imageBitmap => {
            console.log('Frame grabbed: ', imageBitmap);
            //canvas.width = imageBitmap.width;
            //canvas.height = imageBitmap.height;
            //console.log(canvas);
            //canvas.getContext('2d').drawImage(imageBitmap, 0, 0);
            estimate(imageBitmap);
        })
        .catch(err => console.error('takePhoto() failed: ', err));
}

function makeFile() {
    let blob = new Blob([JSON.stringify(jsonData, undefined, 4)], {
        type: 'application/json'
    });
    let file = window.URL.createObjectURL(blob)
    return file;
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
//const posenet = require('@tensorflow-models/posenet');
console.log(posenet);
let net;
let jsonData = {};
let filename = "poseData.json";
let id = 0;
let keypointIndices = [0, 1, 2, 5, 6];

async function startup() {
	net = await posenet.load();
}

async function estimate(image) {
	let pose = await net.estimateSinglePose(image);
    let d = new Date();
    console.log(pose);
    console.log(d.toString());
    let jsonObject = {"score": pose["score"], "time": d.toString()};
    let keypoints = [];
    for (let i = 0; i < keypointIndices.length; ++i) {
        keypoints.push(pose["keypoints"][keypointIndices[i]]);
    }
    jsonObject["keypoints"] = keypoints;
    console.log(jsonObject);
    jsonData[id++] = jsonObject;
}

function process(data, canvas) {
    const track = data.getVideoTracks()[0];
    let imageCapture = new ImageCapture(track);
    imageCapture.grabFrame().then(imageBitmap => {
        console.log('Frame grabbed: ', imageBitmap);
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
        console.log(canvas);
        canvas.getContext('2d').drawImage(imageBitmap, 0, 0);
		estimate(imageBitmap);
    })
    .catch(err => console.error('takePhoto() failed: ', err));
}

function makeFile() {
    let blob = new Blob([JSON.stringify(jsonData, undefined, 4)], {type: 'application/json'});
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

export { process, writeToFile }


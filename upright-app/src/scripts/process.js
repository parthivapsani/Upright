//const posenet = require('@tensorflow-models/posenet');
console.log(posenet);
var net;
var jsonData = {};
var filename = "poseData.json";
var id = 0;
var keypointIndices = [0, 1, 2, 5, 6];

async function startup() {
	net = await posenet.load();
}

async function estimate(image) {
	var pose = await net.estimateSinglePose(image);
    var d = new Date();
    console.log(pose);
    var jsonObject = {"score": pose["score"], "time": d.toLocaleTimeString()};
    var keypoints = [];
    for (var i = 0; i < keypointIndices.length; ++i) {
        keypoints.push(pose["keypoints"][keypointIndices[i]]);
    }
    jsonObject["keypoints"] = keypoints;
    console.log(jsonObject);
    jsonData[id++] = jsonObject;
}

function process(data, canvas) {
    console.log('processing: ', data);
    console.log("process: ", data.getVideoTracks());
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
    var blob = new Blob([JSON.stringify(jsonData, undefined, 4)], {type: 'application/json'});
    var file = window.URL.createObjectURL(blob)
    return file;
}

function writeToFile(document, window) {
    var link = document.createElement('a');
    link.setAttribute('download', filename);
    link.href = makeFile(window);
    document.body.appendChild(link);
    window.requestAnimationFrame(function () {
        var event = new MouseEvent('click');
        link.dispatchEvent(event);
        document.body.removeChild(link);
    });
}

startup();

export { process, writeToFile }


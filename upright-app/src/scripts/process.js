let net;
let jsonData = {};
let filename = "poseData.json";
let id = 0;
let keypointIndices = [0, 1, 2, 5, 6];

//from 0 to 1
//0 means it'll say ur always slouching
//1 means you'll basically never be slouching
let sensitivity= 0.1

let baseline = null;
let shoulderbase = null;
let latestimg;


function dist(x1, y1, x2, y2){
	return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1 - y2, 2))

}

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
    //console.log(jsonObject);
    jsonData[id++] = jsonObject;

	let nose = pose["keypoints"][0]["position"]["y"]
	let shoulder = (pose["keypoints"][5]["position"]["y"] + pose["keypoints"][6]["position"]["y"])/2

	let eye_l = pose["keypoints"][1]["position"];
	let eye_r = pose["keypoints"][2]["position"];

	let eyeWidth = dist(eye_l['x'], eye_l['y'], eye_r['x'], eye_r['y'])

	let shoulder_l = pose["keypoints"][5]["position"]
	let shoulder_r = pose["keypoints"][6]["position"]

    let shoulderWidth = dist(shoulder_l['x'], shoulder_l['y'], shoulder_r['x'], shoulder_r['y'])
    let metric = shoulder - nose;
	// nose = nose / 480;
	// shoulder = shoulder / 480;
	//
	let metric2 = eyeWidth/shoulderWidth;


	if(baseline === null){
		baseline = metric;
        shoulderbase = shoulderWidth;
		baseline = metric2;
	}

	console.log("slouch index:");
    console.log(metric2);
    //console.log(shoulderbase - shoulderWidth);

	if(metric2 > baseline * (1 + sensitivity) || metric2 < baseline*(1-sensitivity)){
		console.log("you're slouching")
	}
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
		// latestimg = imageBitmap;
		// estimate(latestimg)
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


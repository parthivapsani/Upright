//const posenet = require('@tensorflow-models/posenet');
console.log(posenet);
var net;

async function startup() {
	net = await posenet.load();
}

async function estimate(image) {
	const pose = await net.estimateSinglePose(image);
	console.log(pose);
}

function process(data, canvas) {
    console.log('processing: ', data);
    console.log("process: ", data.getVideoTracks());
    const track = data.getVideoTracks()[0];
    let imageCapture = new ImageCapture(track);
    console.log("here");
    imageCapture.grabFrame().then(imageBitmap => {
        console.log('Frame grabbed: ', imageBitmap);
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
        console.log(canvas);
        canvas.getContext('2d').drawImage(imageBitmap, 0, 0);
		estimate(imageBitmap);
    })
    .catch(err => console.error('takePhoto() failed: ', err));
    console.log("here");
}

startup();

export { process }


import { process, writeToFile } from './process.js';

var canvas = document.querySelector('canvas');

navigator.mediaDevices.getUserMedia({video: true})
  .then(function(stream) {
    if (!stream.getVideoTracks().length) {
        throw new Error("Device does not have webcam");
    }
    document.getElementById('camera').srcObject = stream;
	document.getElementById("takePhoto").addEventListener("click", ()=>{
		//process(stream, canvas);
		setInterval(() => {
			process(stream, canvas)
		}, 5000);

	});
    document.getElementById("save").addEventListener("click", () => {
        writeToFile(document, window);
    });


  }).catch(function() {
    alert('could not connect stream');
  });

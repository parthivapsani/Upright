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
    })
    .catch(err => console.error('takePhoto() failed: ', err));
    console.log("here");
    // console.log("Took photo: ", photoBlob);
}

export { process }



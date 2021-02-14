var db = firebase.firestore();

function uploadSlouchToFirestore(uid, data) {
    db.collection('users').doc(uid).collection('slouches').add(data)
    .then((docRef) => {
        console.log('Succesfully uploaded to Firestore')
    })
    .catch((error) => {
        console.log(`Error uploading to Firestore: ${error}`);
    })
}

export { uploadSlouchToFirestore }
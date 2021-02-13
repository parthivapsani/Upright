var db = firebase.firestore();

function signUp(email, password, userInfo, completion) {
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in 
            var user = userCredential.user;
            db.collection('users').doc(user.uid).set(userInfo)
                .then(function () {
                    userInfo['email'] = email;
                    userInfo['uid'] = user.uid;
                    completion(userInfo);
                });
        })
        .catch((error) => {
            console.log(`Error signing up: ${error.message}`);
        });
}

function logIn(email, password, completion) {
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            var user = userCredential.user;
            db.collection('users').doc(user.uid).get()
                .then((doc) => {
                    if (doc.exists) {
                        var data = doc.data();
                        data['email'] = email;
                        data['uid'] = user.uid;
                        completion(data);
                    }
                });
        })
        .catch((error) => {
            console.log(`Error logging in: ${error.message}`);
        });
}

function logOut(completion) {
    firebase.auth().signOut()
        .then(function () {
            console.log('Successfully logged out');
            completion();
        });
}

export { signUp, logIn, logOut }
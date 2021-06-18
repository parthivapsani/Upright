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

/*
 * Note: to add call these functions, add this to the HTML file:
 * 
 * <script src="https://www.gstatic.com/firebasejs/8.2.7/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.2.7/firebase-analytics.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.2.7/firebase-auth.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.2.7/firebase-firestore.js"></script>
    <script>
        // For Firebase JS SDK v7.20.0 and later, measurementId is optional
        const firebaseConfig = {
            apiKey: "AIzaSyDOiCmoUqaqOJYddH8JiDxxHR8QnjZAURc",
            authDomain: "upright-th21.firebaseapp.com",
            projectId: "upright-th21",
            storageBucket: "upright-th21.appspot.com",
            messagingSenderId: "52564962928",
            appId: "1:52564962928:web:1724b0fa750a7f04cfceb5",
            measurementId: "G-EMF7VN18XJ"
        };
        firebase.initializeApp(firebaseConfig);
        firebase.analytics();
    </script>
 */
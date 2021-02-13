const {
    ipcRenderer
} = require('electron');

var firebase = require("firebase/app");
require("firebase/auth");

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

firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        var uid = user.uid;
        console.log(uid);
        // ...
    } else {
        // User is signed out
        // ...
    }
});

// firebase.auth().createUserWithEmailAndPassword("hello@test.com", "password!")
//     .then((userCredential) => {
//         // Signed in 
//         var user = userCredential.user;
//         console.log(userCredential);
//         console.log(user);
//         // ...
//     })
//     .catch((error) => {
//         var errorCode = error.code;
//         var errorMessage = error.message;
//         console.log(errorMessage);
//         // ..
//     });

document.querySelector("#complete").addEventListener('click', function () {
    console.log('clicked');
    ipcRenderer.send('onboarding-completed');
});
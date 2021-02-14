const { ipcRenderer } = require('electron');

document.querySelector("#complete").addEventListener('click', function() {
    console.log('clicked');
    ipcRenderer.send('onboarding-completed');
});
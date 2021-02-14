const {
    ipcRenderer
} = require('electron');

const indicator1 = document.querySelector("#indicator-1");
const indicator2 = document.querySelector("#indicator-2");
const indicator3 = document.querySelector("#indicator-3");
const leftArrow = document.querySelector("#left-arrow");
const rightArrow = document.querySelector("#right-arrow");
const leftItem = document.querySelector('#item-1');
const cta = document.querySelector('#landing-next');

const activeClass = 'Landing-indicatorActive';

var currentIndicator = 0;

function updateActiveIndicator() {
    [indicator1, indicator2, indicator3].forEach(function(button, i) {
        if (i == currentIndicator) {
            button.classList.add(activeClass);
        } else {
            button.classList.remove(activeClass)
        }
    });
    leftItem.style.marginLeft = "-" + (currentIndicator * 100) + "%";
}

indicator1.addEventListener('click', function () {
    currentIndicator = 0;
    updateActiveIndicator();
});

indicator2.addEventListener('click', function () {
    currentIndicator = 1;
    updateActiveIndicator();
});

indicator3.addEventListener('click', function () {
    currentIndicator = 2;
    updateActiveIndicator();
});

leftArrow.addEventListener('click', function() {
    currentIndicator = currentIndicator > 0 ? currentIndicator - 1 : 0;
    updateActiveIndicator();
});

rightArrow.addEventListener('click', function() {
    currentIndicator = currentIndicator < 2 ? currentIndicator + 1 : 2;
    updateActiveIndicator();
});

cta.addEventListener('click', function() {
    ipcRenderer.send('landing-next');
});
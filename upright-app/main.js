const {
	menubar
} = require('menubar');

const {
	app,
	BrowserWindow,
	ipcMain
} = require('electron');

const Datastore = require('nedb');

const db = new Datastore({
	filename: 'local/defaults'
});

function loadMenuBar() {
	var mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		show: false,
		webPreferences: {
			nodeIntegration: true
		}
	});

	mainWindow.loadURL('file://' + __dirname + '/views/index.html');

	mainWindow.on('closed', function () {
		mainWindow = null;
	});

	const mb = menubar({
		browserWindow: mainWindow,
		preloadWindow: true
	});

	mb.on('ready', () => {
		console.log('Running menu bar');
	});

	mb.on('window-all-closed', function () {
		if (process.platform != 'darwin')
			mb.quit();
	});
}

function loadOnboarding() {
	var mainWindow = new BrowserWindow({
		webPreferences: {
			nodeIntegration: true
		}
	});
	mainWindow.loadURL('file://' + __dirname + '/src/views/onboarding.html');

	ipcMain.on('onboarding-completed', (event, arg) => {
		console.log('completed!');
	});
}

app.on('ready', function () {
	loadMenuBar();
});
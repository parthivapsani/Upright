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
	filename: 'local/defaults.db'
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
		maxWidth: 1440,
		maxHeight: 900,
		webPreferences: {
			nodeIntegration: true
		}
	});
	mainWindow.maximize();
	mainWindow.loadURL('file://' + __dirname + '/src/views/landing.html');

	ipcMain.on('landing-next', (event, arg) => {
		loadRegistration(mainWindow);
	});

	ipcMain.on('onboarding-completed', (event, arg) => {
		const doc = {
			onboarded: true
		}
		db.insert(doc);
		loadMenuBar();
		mainWindow.destroy();
	});
}

function loadRegistration(window) {
	window.loadURL('file://' + __dirname + '/src/views/registration.html');
}

function resetOnboarding() {
	db.remove({
		onboarded: true
	}, {
		multi: true
	}, function (err, numReplaced) {
		console.log('Deleted ', numReplaced, ' onboarding files.');
	});
}

app.on('ready', function () {
	db.loadDatabase();
	db.find({
		onboarded: true
	}, function (err, docs) {
		if (docs.length > 0) {
			loadMenuBar();
		} else {
			loadOnboarding();
		}
	})
});
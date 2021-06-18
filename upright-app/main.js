const {
	menubar
} = require('menubar');

const {
	app,
	BrowserWindow,
	ipcMain
} = require('electron');

const url = require('url');
const path = require('path');
const Datastore = require('nedb');

const db = new Datastore({
	filename: path.join(__dirname, 'defaults.db')
});

let currentMenubar = null;

function getUserData(completion) {
	db.find({
		onboarded: true
	}, function (err, docs) {
		if (docs.length > 0) {
			console.log('perform completion with, ', docs[0]);
			completion(docs[0]);
		} else {
			completion(undefined);
		}
	});
}

function loadSettings() {
	var mainWindow = new BrowserWindow({
		maxWidth: 1440,
		maxHeight: 900,
		webPreferences: {
			nodeIntegration: true
		}
	});
	mainWindow.maximize();
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'src/views/settings.html'),
		protocol: 'file:',
		slashes: true
	  }));

	mainWindow.webContents.on('did-finish-load', function () {
		getUserData(function(userData) {
			console.log('sending user data', userData);
			mainWindow.webContents.send('userData2', userData);
		})
	});

	ipcMain.on('reset-baselines', (event, arg) => {
		loadBaseline(mainWindow);
	});

	ipcMain.on('settings-close', (event, arg) => {
		mainWindow.destroy();
	});
}

function loadMenuBar() {
	getUserData(function (userData) {
		var mainWindowOptions = {
			width: 640,
			height: 480,
			show: false,
			resizable: false,
			webPreferences: {
				nodeIntegration: true,
			},
		};

		const mb = menubar({
			browserWindow: mainWindowOptions,
			preloadWindow: true,
			index: 'file://' + __dirname + '/src/views/index.html',
            icon: "./src/assets/small_letter.png"
		});

		mb.on('ready', () => {
            console.log(app.name);
            app.setAppUserModelId(app.name);
			mb.tray.setImage(path.join(__dirname, 'letter-20.png'));
			mb.window.webContents.send('userData', userData);
            mb.showWindow();
		});

		mb.on('window-all-closed', function () {
			if (process.platform != 'darwin')
				mb.quit();
		});

		currentMenubar = mb;
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
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'src/views/landing.html'),
		protocol: 'file:',
		slashes: true
	  }));

	ipcMain.on('landing-next', (event, arg) => {
		loadBaseline(mainWindow)
	});
}

function loadRegistration(window) {
	window.loadURL('file://' + __dirname + '/src/views/registration.html');

	ipcMain.on('registered', (event, userData) => {
		loadBaseline(window, userData);
	});
}

function loadBaseline(window) {
	// window.loadURL('file://' + __dirname + '/src/views/baseline.html');
	window.loadURL(url.format({
		pathname: path.join(__dirname, 'src/views/baseline.html'),
		protocol: 'file:',
		slashes: true
	  }));


	ipcMain.on('baseline-complete', (event, baseline) => {
		getUserData(function(data) {
			if (typeof(data) != 'undefined') {
				data.baseline = baseline;
				db.update(
					{ _id: data._id }, 
					{ $set: { baseline: baseline }}, 
					function(err, numReplaced) {
						console.log('Updated ', numReplaced, ' files; Set baseline to ', baseline);
						if (currentMenubar != null) {
							currentMenubar.window.webContents.send('userData', data);
							currentMenubar.showWindow();
						}
						window.destroy();
					});
			} else {
				var userData = {
					onboarded: true,
					baseline,
					sensitivity: 9,
					confidence: 30,
					fps: 3,
					cooldown: 9,
					sound: true,
					outOfFrame: true
				}
				db.insert(userData);
				loadMenuBar();
				window.destroy();
			}
		});
	});
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

ipcMain.on('settings-open', (event, arg) => {
	loadSettings();
});

ipcMain.on('reset-baseline', (event, arg) => {
	loadBaseline();
});

ipcMain.on('update-user-data', (event, userData) => {
	db.update({
		_id: userData._id
	}, userData, function(err, numReplaced) {
		console.log(`Updated ${numReplaced} files`);
		if (currentMenubar != null) {
			currentMenubar.window.webContents.send('userData', userData);
		}
	});
});

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
	});
});

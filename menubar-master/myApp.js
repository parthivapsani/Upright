const {
	menubar
} = require('menubar');

const {
	app,
	BrowserWindow
} = require('electron');

app.on('ready', function () {
	var mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
    show: false,
		webPreferences: {
			nodeIntegration: true
		}
	});

	// and load the index.html of the app.
	mainWindow.loadURL('file://' + __dirname + '/index.html');

	// Emitted when the window is closed.
	mainWindow.on('closed', function () {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null;
	});

	const mb = menubar({
		browserWindow: mainWindow,
    preloadWindow: true
	});

	mb.on('ready', () => {
		console.log('app is ready');
		// Create the browser window.

	});

	mb.on('window-all-closed', function () {
		if (process.platform != 'darwin')
			mb.quit();
	});
})

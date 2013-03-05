var fs = require('node-fs');
var ui = require('./modules/ui.js');
var readConfig = require('./modules/config.js');

// List of Active Cronjobs
var cronjobs = [];

try {
	// Reload Config when saved
	fs.watch('./config/config.json', function (event, filename) {
		readConfig(cronjobs);
	});
	readConfig(cronjobs);

	// Run UI interface
	ui.run();

} catch(e) {
	console.log(e);
}
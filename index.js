var ui = require('./modules/ui.js');
var storage = require('node-persist');
var crons = require('./modules/cronjobs.js');


try {

	if (!storage.getItem('sites')) {
		storage.setItem('sites', []);
	}

	if (!storage.getItem('config')) {
		var config = {
			folder: __dirname + '/backups'
		};

		storage.setItem('config', config);
	}

	// Run UI interface
	ui.run();

	// Init the scheduled jobs
	crons.init();

} catch(e) {
	console.log(e);
}
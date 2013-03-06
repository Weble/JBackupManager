var fs = require('node-fs');
var ui = require('./modules/ui.js');

// List of Active Cronjobs
var cronjobs = [];

try {
	// Ensure config files exist
	if (!fs.existsSync('./config/')){
		fs.mkdirSync('./config/', 0755);
		if (!fs.existsSync('./config/config.json')){
			fs.writeFileSync('./config/config.json', '{}');
		}
		if (!fs.existsSync('./config/default.json')){
			var cfg = {
				sites: {},
				folder: "./backups",
				s3: {
					key: "",
			  		secret: "",
			  		bucket: ""
				}
			};
			fs.writeFileSync('./config/default.json', JSON.stringify(cfg, null, 4));
		}
	}
	
	var readConfig = require('./modules/config.js');

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
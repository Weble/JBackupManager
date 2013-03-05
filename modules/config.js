var fs = require('node-fs');
var config = require('config');
var cronjob = require('cron').CronJob;
var akeeba = require('akeebabackup');
var bad = require('./backup.js');
var extend = require('node.extend');

/**
 * Read the config from the dedicated file
 * @param  {object} cronjobs The list of active cronjobs
 */
function readConfig(cronjobs) {

	// Stop and delete cronjobs before restarting them
	for (var i in cronjobs) {
		var job = cronjobs[i];
		job.stop();
		delete(cronjobs[i]);
	}

	// Read default and runtime config
	var data = fs.readFileSync('./config/config.json');
	config = extend(config, JSON.parse(data));

	var sites = config.sites ? config.sites : {};	

	// Start a cronjob for each site
	for (var k in sites) {
		var site = sites[k];

		// If the cron is set
		if (site.cron) {

			// Store it to be able to stop the jobs
			cronjobs[k] = 
				new cronjob(
					site.cron, 
					function(){
						this.k = k;
						// start the backup and the download
						var backup = new akeeba(this.url, this.key);
						bad.backupAndDownload(backup, this);
					},
					function(){
						
					}, 
					true, // Start now
 					null,
					site // Context
				);
		}
	}
}

module.exports = readConfig;
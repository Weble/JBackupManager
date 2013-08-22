var fs = require('node-fs');
var cronjob = require('cron').CronJob;
var akeeba = require('akeebabackup');
var bad = require('./backup.js');
var extend = require('node.extend');
var _ = require('underscore');
var storage = require('node-persist');

// Global list of cron jobs
var cronjobs = [];

/**
 * Read the config from the dedicated file
 */
function init() {

	// Stop and delete cronjobs before restarting them
	for (var i in cronjobs) {
		var job = cronjobs[i];
		job.stop();
		delete(cronjobs[i]);
	}


	var sites = storage.getItem('sites');

	// Start a cronjob for each site
	_.each(sites, function(site, k){
		
		// If the cron is set
		if (site.cron) {

			// Store it to be able to stop the jobs
			cronjobs.push( 
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
				)
			);
		}
	});
}
var crons = {};
crons.init = init;

module.exports = crons;
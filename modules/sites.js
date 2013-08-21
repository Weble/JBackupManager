var fs = require('node-fs');
var crontime = require('cron').CronTime;
var date = require('datejs');
var storage = require('node-persist');
var akeeba = require('akeebabackup');
var _ = require('underscore');
var crons = require('./cronjobs.js');
var backup = require('./backup.js');
var path = require('path');

storage.initSync();

/**
 * List the websites
 * @param  {object}   req  The request
 * @param  {object}   res  The response object
 * @param  {Function} next The next call
 */
exports.list = function(req, res, next){
	var sites = storage.getItem('sites');
	var config = storage.getItem('config');

	// Render the sites view
	res.render('sites', {
	    sites: sites,
	    crontime: crontime,
	    datejs: date,
	    config: config,
	    title: "Sites",
	    header: "Sites"
	  });
};

/**
 * Trigger a manual Backup
 * @param  {object}   req  The request
 * @param  {object}   res  The response object
 * @param  {Function} next The next call
 */
exports.backup = function(req, res, next){
	var k = req.params.k;
	var sites = storage.getItem('sites');
	var site = sites[k];
	var config = storage.getItem('config');

	site.k = k;
	
	var bkp = new akeeba(site.url, site.key);
	backup.backupAndDownload(bkp, site);

	// Redirect
	res.writeHead(302, {
      'Location': '/'
    });
    res.end();
};

/**
 * Download a Website Backup
 * @param  {object}   req  The request
 * @param  {object}   res  The response object
 * @param  {Function} next The next call
 */
exports.download = function(req, res, next){
	var k = req.params.k;
	var sites = storage.getItem('sites');
	var site = sites[k];
	var config = storage.getItem('config');

	site.k = k;
	
	var bkp = new akeeba(site.url, site.key);
	bkp.listBackups(function(list){
		downloaded = false;
		_.each(list, function(data){
			if (!downloaded && data.status == 'complete' && data.tag != 'restorepoint') {
				downloaded = true;
				var archive = data.archivename;
				backup.download(data.id, site, archive);
			}
		});
	});

	// Redirect
	res.writeHead(302, {
      'Location': '/'
    });
    res.end();
};

/**
 * Edit a Website
 * @param  {object}   req  The request
 * @param  {object}   res  The response object
 * @param  {Function} next The next call
 */
exports.edit = function(req, res, next){
	var k = req.params.k;
	var sites = storage.getItem('sites');
	var site = sites[k];
	
	var cron_data = {
		minute: '0',
		hour: '0',
		day: '*',
		month: '*',
		weekday: '*'
	};
	
	// new site ?
	if (k == 'undefined' || !site) {
		site = {};
		site.name = 'New Site';
		site.keep = 3;
		site.backup_count = 0;
		site.profiles = []
		k = '';
	} else {
		cron = new crontime(site.cron);
		cron = cron.source.split(" ");
		cron_data = {
			minute: cron[1],
			hour: cron[2],
			day: cron[3],
			month: cron[4],
			weekday: cron[5]
		};

		if (!site.profiles) {
			site.profiles = [];
		}
	}

	// Render the edit view
	res.render('site', {
		id: k,
	    site: site,
	    title: "Site",
	    header: "Site",
	    cron: cron_data,
	    _: _
  	});
};

/**
 * Save and redirect
 * @param  {object}   req  The request
 * @param  {object}   res  The response object
 * @param  {Function} next The next call
 */
exports.save = function(req, res, next) {
	// Save data
	var data = req.body;
	if (data) {
		if (data.name) {
			var cron = data.cron;
			var sites = storage.getItem('sites');
			var config = storage.getItem('config');
		
			// New key
			var k = req.params.k;
			if (!req.params.k || req.params.k == 'undefined') {
				k = Object.keys(sites).length;
			}

			var old_site = sites[k];

			// Data to be saved
			var site = {
				name: data.name,
				url: data.url,
				key: data.key,
				cron: "00 " + cron.min + " " + cron.h + " " + cron.d + " " + cron.m + " " + cron.wd,
				keep: data.keep ? data.keep : 3,
				profile: data.profile ? data.profile : null,
				backup_count: old_site ? old_site.backup_count : 0,
				profiles: []
			};

			// Save download option based on type
			switch(data["download-type"]) {
				case "s3":
					site.s3 = {
						bucket: data.bucket,
						folder: data["s3-folder"]
					};
					site.download = {
						folder: data["folder"]
					};
					break;
				case "direct":
					site.download = {
						folder: data["folder"]
					};
					break;
			}

			// Get Profiles, if possible
			try {
				var backup = new akeeba(site.url, site.key);
				var key = k;
				backup.getProfiles(function(data){
					
					if (data) {
						_.each(data, function(i){
							if (i.id) {
								sites[key].profiles[i.id] = i.name;
							}
						});
						
						// Save config
						storage.setItem('sites', sites);
					}

				});
			} catch(e) {

			}

		
			// Save config
			sites[k] = site;
			storage.setItem('sites', sites);

			crons.init();

			// Redirect
			res.writeHead(302, {
              'Location': '/'
            });
            res.end();
		} else {
			res.send('Error');
		}
	} else{
		res.send('Error');
	}
};

/**
 * Delete a website
 * @param  {object}   req  The request
 * @param  {object}   res  The response object
 * @param  {Function} next The next call
 */
exports.remove = function(req, res, next) {
	var k = req.params.k;
	if(k != 'undefined' && k) {

		var sites = storage.getItem('sites');

		// Delete and save config
		delete(sites[k]);
		storage.setItem('sites', sites);

		// Redirect
		res.writeHead(302, {
          'Location': '/'
        });
        res.end();
	} else {
		res.send('Error');
	}
};

/**
 * Save the global config
 * @param  {object}   req  The request
 * @param  {object}   res  The response object
 * @param  {Function} next The next call
 */
exports.saveconfig = function(req, res, next) {
	var data = req.body;
	if (data) {

		var config = storage.getItem('config');

		// Config options
		config.folder = data.folder;
		
		if (data["s3-bucket"] && data["s3-key"] && data["s3-secret"]) {
			config.s3 = {
				key: data["s3-key"],
				secret: data["s3-secret"],
				bucket: data["s3-bucket"]
			};
		}

		// Save
		storage.setItem('config', config);

		// Redirect
        res.writeHead(302, {
          'Location': '/'
        });
        res.end();
	} else {
		res.send('Error');
	}
};
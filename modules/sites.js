var config = require('config');
var fs = require('node-fs');
var crontime = require('cron').CronTime;
var date = require('datejs');
var saveconfig = require('./save.js');

/**
 * List the websites
 * @param  {object}   req  The request
 * @param  {object}   res  The response object
 * @param  {Function} next The next call
 */
exports.list = function(req, res, next){
	var sites = config.sites ? config.sites : {};

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
 * Edit a Website
 * @param  {object}   req  The request
 * @param  {object}   res  The response object
 * @param  {Function} next The next call
 */
exports.edit = function(req, res, next){
	var k = req.params.k;
	var sites = config.sites ? config.sites : {};
	var site = sites[k];

	// new site ?
	if (req.params.k == 'undefined' || !site) {
		site = {};
		site.name = 'New Site';
		site.keep = 3;
		site.backup_count = 0;
		k = '';
	}

	// Render the edit view
	res.render('site', {
		k: k,
	    site: site,
	    title: "Site",
	    header: "Site"
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
			var sites = config.sites ? config.sites : [];
		
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
				backup_count: old_site ? old_site.backup_count : 0
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
		
			// Save config
			config.sites[k] = site;
			saveconfig();

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

		// Delete and save config
		delete(config.sites[k]);
		saveconfig();

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
		saveconfig();

		// Redirect
        res.writeHead(302, {
          'Location': '/'
        });
        res.end();
	} else {
		res.send('Error');
	}
};
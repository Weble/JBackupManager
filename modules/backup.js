var program = require('commander');
var fs = require('node-fs');
var path = require('path');
var config = require('config');
var aws = require('./aws.js');
var akeeba = require('akeebabackup');
var saveconfig = require('./save.js');

/**
 * Backup and Download the files
 * @param  {akeeba} backup The akeebabackup module for the backup
 * @param  {object} site   The site object from the config
 */
function backupAndDownload(backup, site) {

	var backup_id = null;
	var archive = '';

	// When the backup is completed, download the file if necessary
	backup.on('completed', function(data){
		
		// Archive extension
		var ext = path.extname(archive);
		
		// File name to respect the quota
		filename = site.name + '-' + (site.backup_count  % site.keep) + ext;
		
		// S3 download?
		if (site.s3) {

			// Download from S3
			aws.downloadBackup(site, filename, function(){
				// Increase backup count to respect the quota
				site.backup_count = site.backup_count + 1;
				// Save the count
				config.sites[site.k] = site;
				saveconfig();
			});

		} else {
			// Direct download from the site?
			if (site.download) {
				
				// File names
				var file = config.folder + '/' + site.download.folder + '/' + filename;
				var folder = path.normalize(path.dirname(file));

				// Create directory if necessary
				fs.mkdir(folder, 0755, true, function(){
					// Create new akeeba object to avoid events interference
					var download = new akeeba(site.url, site.key);

					// When completed, update count of backups to respect quota
					download.on('completed', function(){
						
						// Save config
						site.backup_count = site.backup_count + 1;
						config.sites[site.k] = site;
						saveconfig();
					});

					// launch download!
					download.download(backup_id, file);
				});
			}
		}
	});

	// Save backup id and file name for the download operation
	backup.on('started', function(data){
		if (data) {
			if (data.data) {
				backup_id = data.data.BackupID;
				archive = data.data.Archive;
			}
		}
	});

	// Start the backup
	backup.backup(site.profile);
}

exports.backupAndDownload = backupAndDownload;
var program = require('commander');
var fs = require('node-fs');
var path = require('path');
var aws = require('./aws.js');
var akeeba = require('akeebabackup');
var storage = require('node-persist');
var _ = require('underscore');

/**
 * Backup and Download the files
 * @param  {akeeba} backup The akeebabackup module for the backup
 * @param  {object} site   The site object from the config
 */
function backupAndDownload(backup, site) {

	var backup_id = null;
	var archive = '';
	var config = storage.getItem('config');
	var sites = storage.getItem('sites');

	// When the backup is completed, download the file if necessary
	backup.on('completed', function(data){
		download(backup_id, site, archive);
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

	// Save backup id and file name for the download operation
	backup.on('step', function(data){
		if (data) {
			if (data.data) {
				_.each(global.sockets, function(socket){
					var info = {
						percentage: data.data.Progress,
						key: site.k
					};
					socket.emit('backup-step', info);
				});
			}
		}
	});

	// Start the backup
	backup.backup(site.profile);
}

function download(backup_id, site, archive) {
	// Archive extension
	var ext = path.extname(archive);
	
	// File name to respect the quota
	filename = site.name + '-' + (site.backup_count  % site.keep) + ext;

	_.each(global.sockets, function(socket){
		socket.emit('backup-completed', true);
	});

	var config = storage.getItem('config');
	var sites = storage.getItem('sites');
	
	// S3 download?
	if (site.s3) {
		// Download from S3
		aws.downloadBackup(site, archive, function(){
			// Increase backup count to respect the quota
			site.backup_count = site.backup_count + 1;
			// Save the count
			sites[site.k] = site;
			storage.setItem('sites', sites);
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

				download.getBackupInfo(backup_id, function(data){

					var total_size = data.total_size;

					download.on('step', function(data){
						fs.stat(file, function(err, stat){
							var size = stat.size;
							var info = {
								key: site.k,
								received: size,
								total: total_size,
								percentage: ((size * 100) / total_size)
							};
							_.each(global.sockets, function(socket){
								socket.emit('download-step', info);
							});
						});
					});

					// When completed, update count of backups to respect quota
					download.on('completed', function(){
						
						// Save config
						site.backup_count = site.backup_count + 1;
						sites[site.k] = site;
						storage.setItem('sites', sites);

						_.each(global.sockets, function(socket){
							var info = {
								key: site.k
							};
							socket.emit('download-completed', info);
						});
					});


					// launch download!
					download.download(backup_id, file);
				});
			});
		}
	}
}


exports.backupAndDownload = backupAndDownload;
exports.download = download;
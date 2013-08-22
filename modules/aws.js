var knox = require('knox');
var s3 = require('s3');
var path = require('path');
var fs = require('node-fs');
var storage = require('node-persist');
var _ = require('underscore');

/**
 * Download a backup file from Amazon S3
 * 
 * @param  {object}   site     The site object from the config
 * @param  {string}   archive  The archive name from akeeba
 * @param  {Function} callback The function to call when the download ends
 */
function downloadBackup(site, archive, callback) {
	
	var config = storage.getItem('config');

	// Knox Amazon S3 Client
	var client = knox.createClient({
		key: config.s3.key,
		secret: config.s3.secret,
		bucket: site.s3.bucket ? site.s3.bucket : config.s3.bucket
	});

	// Simpler download manager for S3
	var s3client = s3.fromKnox(client);

	// Prefix, folder and download folder paths
	var prefix = path.basename(archive, path.extname(archive));
	var folder = site.s3.folder + '/';
	var download_folder = config.folder + '/' + site.download.folder + '/';

	// Create directory if necessary
	fs.mkdir(download_folder, 0755, true, function(){
		// List all the files matching the folder + archive name
		client.list({prefix: folder + prefix}, function(err, data){
			if (!err) {
				if (data.Contents) {
					
					var done = 0;
					var total_size = 0;
					var total_done = 0;

					// Total Size
					// Download each file locally
					for (var k in data.Contents){
						total_size = total_size + data.Contents[k].Size;
					}

					// Download each file locally
					var k = 0;
					downloadPart(k, data, done, total_size, total_done, s3client, site);
				}

			} else {
				console.log(err);
			}
		});
	});
}

/**
 * Utility method (I know, it sucks, but it's quick and dirty ;))
 */
function downloadPart(k, data, done, total_size, total_done, s3client, site) {
	var config = storage.getItem('config');
	var remote = data.Contents[k].Key;
	var file = path.basename(remote);
	var total_parts = data.Contents.length;
	var download_folder = config.folder + '/' + site.download.folder + '/';

	// Create the directory if it doesn't exist
	var downloader = s3client.download(remote, download_folder + file);

	// Notify the UI with Socket.IO
	downloader.on('progress', function(amountDone, amountTotal) {
		var info = {
			key: site.k,
			received: total_done + amountDone,
			total: total_size,
			percentage: (((total_done + amountDone) * 100) / total_size)
		};
		
		_.each(global.sockets, function(socket){
			socket.emit('download-step', info);
		});
	});
	
	// Keep track of the total number of parts downloaded
	downloader.on('end', function() {
		done = done + 1;

		// Finished the download
		if (done >= total_parts) {
			// Notify the UI with Socket.IO
			_.each(global.sockets, function(socket){
				var info = {
					key: site.k
				};
				socket.emit('download-completed', info);
			});
		} else {
			
			total_done = total_done + data.Contents[k].Size;

			// Notify the UI with Socket.IO
			var info = {
				key: site.k,
				received: total_done,
				total: total_size,
				percentage: ((total_done * 100) / total_size)
			};
			
			_.each(global.sockets, function(socket){
				socket.emit('download-step', info);
			});

			// Go on with the next part
			k = k + 1;
			if (k < data.Contents.length) {
				downloadPart(k, data, done, total_size, total_done, s3client, site);
			}
		}
	});
}

exports.downloadBackup = downloadBackup;
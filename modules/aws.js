var knox = require('knox');
var s3 = require('s3');
var config = require('config');
var path = require('path');
var fs = require('node-fs');

/**
 * Download a backup file from Amazone S3
 * @param  {object}   site     The site object from the config
 * @param  {string}   archive  The archive name from akeeba
 * @param  {Function} callback The function to call when the download ends
 */
function downloadBackup(site, archive, callback) {
	
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

	// List all the files matching the folder + archive name
	client.list({prefix: folder + prefix}, function(err, data){
		if (!err) {
			if (data.Contents) {
				// Download each file locally
				for (var k in data.Contents){
					var remote = data.Contents[k].Key;
					var file = path.basename(remote);

					// Create the directory if it doesn't exist
					fs.mkdir(folder, 0755, true, function(){
						var downloader = s3client.download(remote, download_folder + file);
						downloader.on('progress', function(amountDone, amountTotal) {
							console.log("progress", amountDone, amountTotal);
						});
						downloader.on('end', function() {
							console.log("done");
							callback();
						});
					});
				}
			}
		} else {
			console.log(err);
		}
	});
}

exports.downloadBackup = downloadBackup;
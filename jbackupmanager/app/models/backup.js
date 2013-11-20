module.exports = function(compound, Backup) {
    /**
     * Download
     */
    Backup.prototype.download = function(socket) {

        var $this = this;
        var path = require('path');
        var fs = require('node-fs');
        var akeeba = require('akeebabackup');
        var b = this;

        // Archive extension
        var ext = path.extname(b.archive);
        var $this = this;

        // File name to respect the quota
        var filename = b.archive;

        // S3 download?
        this.site(function(err, site) {

            var url = site.url.replace('http://', '');
            url = url.replace('/', '-');

            // File names
            var file = compound.folder + url + '/' + b.archive;
            var folder = path.normalize(path.dirname(file));

            // Create directory if necessary
            fs.mkdir(folder, 0755, true, function() {
                // Create new akeeba object to avoid events interference
                var download = new akeeba(site.url, site.key);
                var total_size = b.size;

                // Notify the UI with Socket.IO
                download.on('step', function(data) {
                    fs.stat(file, function(err, stat) {
                        var size = stat.size;
                        var info = {
                            key: site.id,
                            id:  $this.id,
                            received: size,
                            total: total_size,
                            percentage: ((size * 100) / total_size)
                        };
                        
                        socket.emit('download-step', info);
                    });
                });

                // When completed, update count of backups to respect quota
                download.on('completed', function() {

                    // Notify the UI with Socket.IO
                    var info = {
                        key: site.id,
                        id: $this.id
                    }

                    b.download_status = 'complete';
                    b.save(function(){
                        b.cron(function(err, cron){
                            if (!err && cron) {
                                site.clearOldBackups(cron);
                            }
                        });
                    });



                    socket.emit('download-completed', info);
                });


                // launch download!
                download.download(b.backup_id, file);

                b.download_status = 'started';
                b.save();
            });
        });
    };

}

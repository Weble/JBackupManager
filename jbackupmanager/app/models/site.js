module.exports = function (compound, Site) {
	
	/**
	 * Backup
	 */
	Site.prototype.backup = function(socket) {
        // Backup
        var akeeba = require('akeebabackup');
        var backup = new akeeba(this.url, this.key);
        var $this = this;

        var b = this.backups.build();

        try {
            // When the backup is completed, download the file if necessary
            backup.on('completed', function(data) {

                b.save(function(){
                    socket.emit('backup-completed', {
                        key: $this.id
                    });
                });

                backup.getBackupInfo(b.backup_id, function(data){
                    b.started = data.backupstart;
                    b.finished = data.backupend;
                    b.status = data.status;
                    b.size = data.total_size;

                    var json = JSON.stringify(data);
                    
                    b.info = json;

                    b.save();
                });

                // launch download
                //$this.download(b);
            });

            // Save backup id and file name for the download operation
            backup.on('started', function(data) {
                if (data) {
                    if (data.data) {

                        b.backup_id = data.data.BackupID;
                        b.archive = data.data.Archive;
                    }
                }
            });

            // Save backup id and file name for the download operation
            backup.on('step', function(data) {
                if (data) {
                    if (data.data) {

                        var info = {
                            percentage: data.data.Progress,
                            key: $this.id
                        };

                        // Notify the UI with Socket.IO
                        socket.emit('backup-step', info);
                    }
                }
            });

            // Start the backup
            backup.backup(this.profile ? this.profile : 1);
        } catch (e) {
            console.log(e);
        }
    };
};
var Site = function() {

    this.defineProperties({
        name: {
            type: 'string',
            required: true
        },
        url: {
            type: 'string',
            required: true
        },
        key: {
            type: 'string',
            required: true
        },
        profile: {
            type: 'int'
        },
        profiles: {
            type: 'object'
        },
        downloadtype: {
            type: 'string'
        },
        downloadfolder: {
            type: 'string'
        },
        s3folder: {
            type: 'string'
        },
        s3bucket: {
            type: 'string'
        },
        quota: {
            type: 'int'
        },
        cron: {
            type: 'object'
        },
        lastbackup: {
            type: 'datetime'
        },
    });

    this.hasMany('Backups');

    /*
  this.property('login', 'string', {required: true});
  this.property('password', 'string', {required: true});
  this.property('lastName', 'string');
  this.property('firstName', 'string');

  this.validatesPresent('login');
  this.validatesFormat('login', /[a-z]+/, {message: 'Subdivisions!'});
  this.validatesLength('login', {min: 3});
  // Use with the name of the other parameter to compare with
  this.validatesConfirmed('password', 'confirmPassword');
  // Use with any function that returns a Boolean
  this.validatesWithFunction('password', function (s) {
      return s.length > 0;
  });
  */
 
    this.getLastBackup = function(callback) {
        var $this = this;
        this.lastbackup = '';
        this.getBackups(function(err, backups){
            if (!err) {
                if (backups.length > 0) {
                    var backup = backups[0];
                    $this.lastbackup = backup.createdAt;
                    $this.save();
                }
            }

            if (callback) {
                callback();
            }
        });
    };
 
    // get the list of profiles
    this.getProfiles = function() {
        // Get Profiles, if possible
        try {
            var akeeba = require('akeebabackup');
            var backup = new akeeba(this.url, this.key);
            var $this = this;
            this.profiles = {};

            // Get the list of profiles
            backup.getProfiles(function(data){                
                if (data) {
                    data.forEach(function(i){     
                        if (i.id) {
                            $this.profiles[i.id] = i.name;
                        }
                    });
                    $this.save();
                }

            });
        } catch(e) {
            
        }
    };

    // Do a backup on this site
    this.backup = function() {
        var akeeba = require('akeebabackup');
        var backup = new akeeba(this.url, this.key);
        var $this = this;
        var b = null;

        try {
            // When the backup is completed, download the file if necessary
            backup.on('completed', function(data) {

                $this.getLastBackup();
                
                geddy.sockets.forEach(function(socket) {
                    socket.emit('backup-completed', {
                        last_backup: b.createdAt,
                        key: $this.id
                    });
                });

                // launch download
                $this.download(b);
            });

            // Save backup id and file name for the download operation
            backup.on('started', function(data) {
                if (data) {
                    if (data.data) {
                        
                        var now = new Date();
                        
                        b = geddy.model.Backup.create();
                        b.backupid = data.data.BackupID;
                        b.archive = data.data.Archive;

                        $this.addBackup(b);
                        $this.save();
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
                        geddy.sockets.forEach(function(socket) {
                            socket.emit('backup-step', info);
                        });
                    }
                }
            });

            // Start the backup
            backup.backup(this.profile);
        } catch (e) {
            console.log(e);
        }
    };

    // Download the backup for this site
    this.download = function(b) {
        
        var path = require('path');
        var fs = require('node-fs');
        var akeeba = require('akeebabackup');

        // Archive extension
        var ext = path.extname(b.archive);
        var $this = this;

        // File name to respect the quota
        var filename = b.archive;

        // S3 download?
        if (this.downloadtype == 's3') {
            // Download from S3
            this.downloadFromS3(b.archive, function(){
              
               
            });

        } else {
            // Direct download from the site?
            if (this.downloadtype == 'direct') {

                // File names
                var file = geddy.settings.folder + this.downloadfolder + '/' + filename;
                var folder = path.normalize(path.dirname(file));

                // Create directory if necessary
                fs.mkdir(folder, 0755, true, function(){
                    // Create new akeeba object to avoid events interference
                    var download = new akeeba($this.url, $this.key);
                    download.getBackupInfo(b.backupid, function(data){
                        
                        console.log(data);

                        var total_size = data.total_size;

                        
                        // Notify the UI with Socket.IO
                        download.on('step', function(data){
                            fs.stat(file, function(err, stat){
                                var size = stat.size;
                                var info = {
                                    key: $this.key,
                                    received: size,
                                    total: total_size,
                                    percentage: ((size * 100) / total_size)
                                };
                                geddy.sockets.forEach(function(socket){
                                    socket.emit('download-step', info);
                                });
                            });
                        });

                        // When completed, update count of backups to respect quota
                        download.on('completed', function(){

                            // Notify the UI with Socket.IO
                            geddy.sockets.forEach(function(socket){
                                var info = {
                                    key: $this.id
                                };
                                socket.emit('download-completed', info);
                            });
                        });


                        // launch download!
                        download.download(b.backupid, file);
                    });
                });
            }
        }
    };

};

/*
// Can also define them on the prototype
Site.prototype.someOtherMethod = function () {
  // Do some other stuff
};
// Can also define static methods and properties
Site.someStaticMethod = function () {
  // Do some other stuff
};
Site.someStaticProperty = 'YYZ';
*/

exports.Site = Site;

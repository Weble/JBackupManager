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

    // get the list of profiles
    this.getAllBackups = function(callback) {
        
        // Get Backups, if possible
        try {
            var $this = this;

            // Already preset => do not update
            this.fetchBackups(function(backups){
                backups.forEach(function(backup){
                    geddy.model.Backup.all({siteId: $this.id, backupid: backup.backupid}, function(err, bkps){
                        if (err || bkps.length <= 0) {
                            $this.addBackup(backup);
                            $this.save();
                        }
                    });
                });
            });

            
        } catch(e) {
            
        }
    };

    this.fetchBackups = function(callback) {
        
        var $this = this;
        var akeeba = require('akeebabackup');
        var akb = new akeeba($this.url, $this.key);
        
        var backups = [];
        // Get the list of profiles
        akb.listBackups(function(data){    
            var backups = [];
            if (data) {
                data.forEach(function(bkp){    
                    b = geddy.model.Backup.create();
                    b.type = 'Backup';

                    var t = bkp.backupstart.split(/[- :]/);
                    b.backupstart = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);

                    var t = bkp.backupend.split(/[- :]/);
                    b.backupend = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);

                    b.backupid = bkp.id;
                    b.archive = bkp.archivename;
                    b.description = bkp.description;
                    b.comment = bkp.comment;
                    b.status = bkp.status;

                   backups.push(b);
                });

                /*$this.getLastBackup(function(){
                    if (callback) {
                        callback();
                    }
                });*/

                callback(backups);
            }

        });
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

                $this.getAllBackups();
                
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
                        b = geddy.model.Backup.create();
                        b.type = 'Backup';                        

                        b.backupid = data.data.BackupID;
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

Site.restartCronjobs = function() {

    var cronjob = require('cron').CronJob;

    geddy.cronjobs.forEach(function(job){
        job.stop();
    });

    geddy.cronjobs = [];

    geddy.model.Site.all(function(err, sites){
        sites.forEach(function(site){
            var cron =  "00 " + site.cron.min + " " + site.cron.h + " " + site.cron.d + " " + site.cron.m + " " + site.cron.wd;

            var c = new cronjob(
                    cron, 
                    function(){
                        this.backup();                    },
                    function(){
                        
                    }, 
                    true, // Start now
                    null,
                    site // Context
                );

            geddy.cronjobs.push(c);
        });
    });
};

exports.Site = Site;

geddy.model.register('Site', Site);
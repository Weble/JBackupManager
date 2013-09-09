var Backup = function () {

  this.defineProperties({
    backupid: {type: 'int'},
    description: {type: 'string'},
    comment: {type: 'string'},
    backupstart: {type: 'datetime'},
    backupend: {type: 'datetime'},
    status: {type: 'string'},
    origin: {type: 'string'},
    type: {type: 'string'},
    profileid: {type: 'int'},
    multipart: {type: 'boolean'},
    tag: {type: 'string'},
    fileexist: {type: 'boolean'},
    meta: {type: 'string'},
    size: {type: 'int'},
    archive: {type: 'string'},
    downloaded: {type: 'boolean'},
    downloadedfile: {type: 'string'}
  });

  this.belongsTo('Site');

  // Download the backup for this site
    this.download = function() {
        
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
        this.getSite(function(err, site){

          if (site.downloadtype == 's3') {
              // Download from S3
              $this.downloadFromS3(b.archive, function(){
                
                 
              });

          } else {
              // Direct download from the site?
              if (site.downloadtype == 'direct') {

                  // File names
                  var file = geddy.settings.folder + site.downloadfolder + '/' + filename;
                  var folder = path.normalize(path.dirname(file));

                  // Create directory if necessary
                  fs.mkdir(folder, 0755, true, function(){
                      // Create new akeeba object to avoid events interference
                      var download = new akeeba(site.url, site.key);
                      download.getBackupInfo(b.backupid, function(data){

                          var total_size = data.total_size;

                          // Notify the UI with Socket.IO
                          download.on('step', function(data){
                              fs.stat(file, function(err, stat){
                                  var size = stat.size;
                                  var info = {
                                      key: site.id,
                                      backupid: $this.id,
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

                              $this.downloadedfile = file;
                              $this.downloaded = true;
                              $this.save();  

                              // Notify the UI with Socket.IO
                              geddy.sockets.forEach(function(socket){
                                  var info = {
                                      key: site.id,
                                      backupid: $this.id
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
        });
    };

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

  // Can define methods for instances like this
  this.someMethod = function () {
    // Do some stuff
  };
  */

};

/*
// Can also define them on the prototype
Backup.prototype.someOtherMethod = function () {
  // Do some other stuff
};
// Can also define static methods and properties
Backup.someStaticMethod = function () {
  // Do some other stuff
};
Backup.someStaticProperty = 'YYZ';
*/

exports.Backup = Backup;


var CreateSites = function () {
  this.up = function (next) {
    var def = function (t) {
          t.column('name', 'string');
          t.column('url', 'string');
          t.column('key', 'string');
          t.column('profile', 'int');
          t.column('profiles', 'array');
          t.column('downloadtype', 'string');
          t.column('downloadfolder', 'string');
          t.column('s3folder', '3folder');
          t.column('s3bucket', '3bucket');
          t.column('quota', 'int');
          t.column('cron', 'object');
        }
      , callback = function (err, data) {
          if (err) {
            throw err;
          }
          else {
            next();
          }
        };
    this.createTable('sites', def, callback);
  };

  this.down = function (next) {
    var callback = function (err, data) {
          if (err) {
            throw err;
          }
          else {
            next();
          }
        };
    this.dropTable('sites', callback);
  };
};

exports.CreateSites = CreateSites;

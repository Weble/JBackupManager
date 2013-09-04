var CreateBackups = function () {
  this.up = function (next) {
    var def = function (t) {
          t.column('p', 'string');
          t.column('time', 'datetime');
          t.column('status', 'string');
        }
      , callback = function (err, data) {
          if (err) {
            throw err;
          }
          else {
            next();
          }
        };
    this.createTable('backup', def, callback);
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
    this.dropTable('backup', callback);
  };
};

exports.CreateBackups = CreateBackups;

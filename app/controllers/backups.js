var Backups = function () {
  this.respondsWith = ['html', 'json', 'xml', 'js', 'txt'];

  this.index = function (req, resp, params) {
    var self = this;

    geddy.model.Backup.all(function(err, backups) {
      self.respond({params: params, backups: backups});
    });
  };

  this.add = function (req, resp, params) {
    this.respond({params: params});
  };

  this.create = function (req, resp, params) {
    var self = this
      , backup = geddy.model.Backup.create(params);

    if (!backup.isValid()) {
      this.flash.error(backup.errors);
      this.redirect({action: 'add'});
    }
    else {
      backup.save(function(err, data) {
        if (err) {
          self.flash.error(err);
          self.redirect({action: 'add'});
        }
        else {
          self.redirect({controller: self.name});
        }
      });
    }
  };

  this.show = function (req, resp, params) {
    var self = this;

    geddy.model.Backup.first(params.id, function(err, backup) {
      if (!backup) {
        var err = new Error();
        err.statusCode = 404;
        self.error(err);
      }
      else {
        self.respond({params: params, backup: backup.toObj()});
      }
    });
  };

  this.edit = function (req, resp, params) {
    var self = this;

    geddy.model.Backup.first(params.id, function(err, backup) {
      if (!backup) {
        var err = new Error();
        err.statusCode = 400;
        self.error(err);
      }
      else {
        self.respond({params: params, backup: backup});
      }
    });
  };

  this.update = function (req, resp, params) {
    var self = this;

    geddy.model.Backup.first(params.id, function(err, backup) {
      backup.updateProperties(params);
      if (!backup.isValid()) {
        this.flash.error(backup.errors);
        this.redirect({action: 'edit'});
      }
      else {
        backup.save(function(err, data) {
          if (err) {
            self.flash.error(err);
            self.redirect({action: 'edit'});
          }
          else {
            self.redirect({controller: self.name});
          }
        });
      }
    });
  };

  this.destroy = function (req, resp, params) {
    var self = this;

    geddy.model.Backup.remove(params.id, function(err) {
      if (err) {
        self.flash.error(err);
        self.redirect({action: 'edit'});
      }
      else {
        self.redirect({controller: self.name});
      }
    });
  };

};

exports.Backups = Backups;

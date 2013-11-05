var Sites = function() {
    this.respondsWith = ['html', 'json', 'xml', 'js', 'txt'];

    this.backup = function(req, resp, params) {
        var self = this;

        geddy.model.Site.first(params.id, function(err, site) {
            site.backup();
            self.respond(true, {
                format: 'json'
            });
        });
    };

    this.download = function(req, resp, params) {
        var self = this;

        geddy.model.Site.first(params.id, function(err, site) {
            site.getBackups(function(err, backups) {
                if (!err && backups.length > 0) {
                    site.download(backups[0]);
                }
            });
            self.respond(true, {
                format: 'json'
            });
        });
    };

    this.index = function(req, resp, params) {
        var self = this;

        geddy.model.Site.all(function(err, sites) {
            var crontime = require('cron').CronTime;

            sites.forEach(function(site){
                var cron =  "00 " + site.cron.min + " " + site.cron.h + " " + site.cron.d + " " + site.cron.m + " " + site.cron.wd;
                var next_backup = new crontime(cron);
                site.nextbackup = next_backup.sendAt();
            });

            self.respond({
                params: params,
                sites: sites
            });
        });
    };

    this.add = function(req, resp, params) {
        this.respond({
            params: params
        });
    };

    this.create = function(req, resp, params) {
        var self = this,
            site = geddy.model.Site.create(params);

        if (!site.isValid()) {
            this.flash.error(site.errors);
            this.redirect({
                action: 'add'
            });
        } else {
            site.save(function(err, data) {
                if (err) {
                    self.flash.error(err);
                    self.redirect({
                        action: 'add'
                    });
                } else {
                    self.redirect({
                        controller: self.name
                    });
                }
            });
        }
    };

    this.show = function(req, resp, params) {
        var self = this;

        geddy.model.Site.first(params.id, function(err, site) {
            if (!site) {
                var err = new Error();
                err.statusCode = 404;
                self.error(err);
            } else {
                site.getBackups(null, {sort: {backupid: 'desc'}}, function(err, backups) {
                    var bkps = [];
                    backups.forEach(function(backup) {
                        // Don't know why this is necessary
                        backup.type = 'Backup';
                        var tmp = backup.toObj();
                        bkps.push(tmp);
                    });

                    var data = site.toObj();
                    data.backups = bkps;

                    self.respond({
                        params: params,
                        site: data
                    });
                });
            }
        });
    };

    this.edit = function(req, resp, params) {
        var self = this;

        geddy.model.Site.first(params.id, function(err, site) {
            if (!site) {
                var err = new Error();
                err.statusCode = 400;
                self.error(err);
            } else {
                if (!site.cron) {
                    site.cron = {};
                }
                self.respond({
                    params: params,
                    site: site
                });
            }
        });
    };

    this.update = function(req, resp, params) {
        var self = this;

        geddy.model.Site.first(params.id, function(err, site) {
            site.updateProperties(params);
            if (!site.isValid()) {
                self.flash.error(site.errors);
                self.redirect({
                    action: 'edit'
                });
            } else {
                site.save(function(err, data) {
                    if (err) {
                        self.flash.error(err);
                        self.redirect({
                            action: 'edit'
                        });
                    } else {
                        site.getProfiles();
                        site.getAllBackups();
                        site.getLastBackup();

                        geddy.model.Site.restartCronjobs();

                        self.redirect({
                            controller: self.name
                        });
                    }
                });
            }
        });
    };

    this.destroy = function(req, resp, params) {
        var self = this;

        geddy.model.Site.remove(params.id, function(err) {
            if (err) {
                self.flash.error(err);
                self.redirect({
                    action: 'edit'
                });
            } else {
                self.redirect({
                    controller: self.name
                });
            }
        });
    };

};

exports.Sites = Sites;

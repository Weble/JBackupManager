load('application');

before(loadSite, {
        only: ['show', 'edit', 'update', 'destroy', 'backup']
    }
);

before(loadSiteBackups, {
        only: ['show']
    }
);

action('new', function () {
    this.title = 'New site';
    this.site = new Site;
    render();
});

action(function create() {
    Site.create(req.body.Site, function (err, site) {
        respondTo(function (format) {
            format.json(function () {
                if (err) {
                    send({code: 500, error: site && site.errors || err});
                } else {
                    send({code: 200, data: site.toObject()});
                }
            });
            format.html(function () {
                if (err) {
                    flash('error', 'Site can not be created');
                    render('new', {
                        site: site,
                        title: 'New site'
                    });
                } else {
                    flash('info', 'Site created');
                    redirect(path_to.sites);
                }
            });
        });
    });
});

action(function index() {
    this.title = 'Sites index';
    Site.all(function (err, sites) {
        switch (params.format) {
            case "json":
                send({code: 200, data: sites});
                break;
            default:
                render({
                    sites: sites
                });
        }
    });
});

action(function show() {
    this.title = 'Site show';
    switch(params.format) {
        case "json":
            send({code: 200, data: this.site});
            break;
        default:
            render();
    }
});

action(function backup() {
    this.title = 'Site Backup';
    this.site.backup(socket());
});

action(function download() {
    this.title = 'Site Backup';
    Backup.find(params.id, function(err, backup){
        backup.download(socket());
    });
});

action(function edit() {
    this.title = 'Site edit';
    switch(params.format) {
        case "json":
            send(this.site);
            break;
        default:
            render();
    }
});

action(function update() {
    var site = this.site;
    this.title = 'Edit site details';
    this.site.updateAttributes(body.Site, function (err) {
        respondTo(function (format) {
            format.json(function () {
                if (err) {
                    send({code: 500, error: site && site.errors || err});
                } else {
                    send({code: 200, data: site});
                }
            });
            format.html(function () {
                if (!err) {
                    flash('info', 'Site updated');
                    redirect(path_to.site(site));
                } else {
                    flash('error', 'Site can not be updated');
                    render('edit');
                }
            });
        });
    });
});

action(function destroy() {
    this.site.destroy(function (error) {
        respondTo(function (format) {
            format.json(function () {
                if (error) {
                    send({code: 500, error: error});
                } else {
                    send({code: 200});
                }
            });
            format.html(function () {
                if (error) {
                    flash('error', 'Can not destroy site');
                } else {
                    flash('info', 'Site successfully removed');
                }
                send("'" + path_to.sites + "'");
            });
        });
    });
});

function loadSite() {
    Site.find(params.id, function (err, site) {
        if (err || !site) {
            if (!err && !site && params.format === 'json') {
                return send({code: 404, error: 'Not found'});
            }
            redirect(path_to.sites);
        } else {
            this.site = site;
            next();
        }
    }.bind(this));
}

function loadSiteBackups() {
    var $this = this;
    this.site.backups({limit: 20, order: 'started DESC'}, function(err, data){
        $this.site.backups_list = data;
        next();
    });
}

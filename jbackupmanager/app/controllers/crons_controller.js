load('application');

var cronjob = require('cron').CronJob;
var akeeba = require('akeebabackup');

before(loadCron, {
    only: ['show', 'edit', 'update', 'destroy']
});

action('new', function () {
    this.title = 'New cron';
    this.cron = new Cron;
    this.cron.site_id = req.query.site_id;
    render();
});

action(function create() {
    Cron.create(req.body.Cron, function (err, cron) {

        if (!err && cron) {
            compound.cronjobs[cron.id] = new cronjob(
                cron.cron,
                function() {
                    this.cron_id = cron.id;
                    site.backup(compound.socket, cron.id);
                },
                function() {

                },
                true, // Start now
                null,
                cron // Context
            );
        }

        respondTo(function (format) {
            format.json(function () {
                if (err) {
                    send({code: 500, error: cron && cron.errors || err});
                } else {
                    send({code: 200, data: cron.toObject()});
                }
            });
            format.html(function () {
                if (err) {
                    flash('error', 'Cron can not be created');
                    render('new', {
                        cron: cron,
                        title: 'New cron'
                    });
                } else {
                    flash('info', 'Cron created');
                    redirect(path_to.site(cron.site()));
                }
            });
        });
    });
});

action(function index() {
    this.title = 'Crons index';
    Cron.all(function (err, crons) {
        switch (params.format) {
            case "json":
                send({code: 200, data: crons});
                break;
            default:
                render({
                    crons: crons
                });
        }
    });
});

action(function show() {
    this.title = 'Cron show';
    switch(params.format) {
        case "json":
            send({code: 200, data: this.cron});
            break;
        default:
            render();
    }
});

action(function edit() {
    this.title = 'Cron edit';
    switch(params.format) {
        case "json":
            send(this.cron);
            break;
        default:
            render();
    }
});

action(function update() {
    var cron = this.cron;
    this.title = 'Edit cron details';
    this.cron.updateAttributes(body.Cron, function (err) {

        if (!err && cron) {
            if (compound.cronjobs[cron.id]) {
                compound.cronjobs[cron.id].stop();
            }

            compound.cronjobs[cron.id] = new cronjob(
                cron.cron,
                function() {
                    this.cron_id = cron.id;
                    site.backup(compound.socket, cron.id);
                },
                function() {

                },
                true, // Start now
                null,
                cron // Context
            );
        }

        respondTo(function (format) {
            format.json(function () {
                if (err) {
                    send({code: 500, error: cron && cron.errors || err});
                } else {
                    send({code: 200, data: cron});
                }
            });
            format.html(function () {
                if (!err) {
                    flash('info', 'Cron updated');
                    redirect(path_to.cron(cron));
                } else {
                    flash('error', 'Cron can not be updated');
                    render('edit');
                }
            });
        });
    });
});

action(function destroy() {
    this.cron.destroy(function (error) {
        respondTo(function (format) {
            format.json(function () {
                if (error) {
                    send({code: 500, error: error});
                } else {
                    send({code: 200});
                    if (compound.socket) {
                        compound.socket.emit('refresh');
                    }
                }
            });
            format.html(function () {
                if (error) {
                    flash('error', 'Can not destroy cron');
                } else {
                    flash('info', 'Cron successfully removed');
                }
                send("'" + path_to.crons + "'");
            });
        });
    });
});

function loadCron() {
    Cron.find(params.id, function (err, cron) {
        if (err || !cron) {
            if (!err && !cron && params.format === 'json') {
                return send({code: 404, error: 'Not found'});
            }
            redirect(path_to.crons);
        } else {
            this.cron = cron;
            next();
        }
    }.bind(this));
}

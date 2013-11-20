module.exports = function(compound) {

    var express = require('express');
    var app = compound.app;

    app.configure(function() {
        app.use(express.static(app.root + '/public', {
            maxAge: 86400000
        }));
        app.set('jsDirectory', '/javascripts/');
        app.set('cssDirectory', '/stylesheets/');
        app.set('cssEngine', 'stylus');
        compound.loadConfigs(__dirname);
        app.use(express.bodyParser());
        app.use(express.cookieParser('secret'));
        app.use(express.session({
            secret: 'secret'
        }));
        app.use(express.methodOverride());
        app.use(app.router);
    });

    // You can configure socket.io at this point.
    compound.on('socket.io', function(io) {
        io.sockets.on('connection', function(socket){
            var hs = socket.handshake;

            socket.on('disconnect', function () {
                console.log('A socket with sessionID ' + hs.sessionID
                    + ' disconnected!');
                // clear the socket interval to stop refreshing the session
            });

            var groupId;

            socket.join(hs.sessionID);

            compound.socket = socket;
        });
    });

    compound.on('ready', function(compound){

        var cronjob = require('cron').CronJob;
        var akeeba = require('akeebabackup');

        compound.cronjobs = [];

        compound.folder = '/home/skullbock/nodebackups/';

        compound.models.Cron.all(function(err, cronjobs) {
            cronjobs.forEach(function(cron){
                cron.site(function(err, site){
                    compound.cronjobs[cron.id] =
                        new cronjob(
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
                    
                })
            });
        });
    });

};

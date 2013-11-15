/*
 db/schema.js contains database schema description for application models
 by default (when using jugglingdb as ORM) this file uses database connection
 described in config/database.json. But it's possible to use another database
 connections and multiple different schemas, docs available at

 http://railwayjs.com/orm.html

 Example of model definition:

 define('User', function () {
     property('email', String, { index: true });
     property('password', String);
     property('activated', Boolean, {default: false});
 });

 Example of schema configured without config/database.json (heroku redistogo addon):
 schema('redis', {url: process.env.REDISTOGO_URL}, function () {
     // model definitions here
 });

*/
var Site = describe('Site', function () {
    property('name', String);
    property('url', String);
    property('key', String);
    set('restPath', pathTo.sites);
});

var Backup = describe('Backup', function () {
    property('backup_id', Number);
    property('started', Date);
    property('finished', Date);
    property('size', Number);
    property('status', String);
    property('download_status', String);
    property('archive', String);
    property('info', Text);
});

var Cron = describe('Cron', function () {
    property('site_id', Number);
    property('cron', String);
    property('quota', Number);
    property('name', String);

    set('restPath', pathTo.crons);
});

Site.hasMany(Backup,   {as: 'backups',  foreignKey: 'site_id'});
Site.hasMany(Cron,   {as: 'crons',  foreignKey: 'site_id'});
Cron.hasMany(Backup,   {as: 'backups',  foreignKey: 'cron_id'});

Backup.belongsTo(Cron,   {as: 'cron',  foreignKey: 'cron_id'});
Backup.belongsTo(Site,   {as: 'site',  foreignKey: 'site_id'});
Cron.belongsTo(Site,   {as: 'site',  foreignKey: 'site_id'});


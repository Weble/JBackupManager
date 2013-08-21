var express = require('express');
var socket = require('socket.io');

global.sockets = [];

/**
 * Run the UI webserver
 */
function run() {
	var app = express();
	var http = require('http');
	var server = http.createServer(app);
	var io = socket.listen(server, { log: false });

	// Ejs parser with html extension
	app.engine('.html', require('ejs').__express);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'html');

	// session support
	app.use(express.cookieParser('backups'));
	app.use(express.session());

	// parse request bodies (req.body)
	app.use(express.bodyParser());

	// Main Controller
	var obj = require('./sites.js');

	// Routes
	app.post('/cleanup', obj.cleanup);
	app.get('/test', obj.test);
	app.post('/site/:k/backup', obj.backup);
	app.post('/site/:k/download', obj.download);
	app.get('/site/:k', obj.edit);
	app.get('/add', obj.edit);
	app.get('/', obj.list);
	app.post('/save/:k', obj.save);
	app.post('/save/', obj.save);
	app.post('/saveconfig', obj.saveconfig);
	app.get('/delete/:k', obj.remove);
	
	// Launch
	server.listen(3000);

	// serve static files
	app.use("/media", express.static(__dirname + '/public'));

	io.sockets.on('connection', function(socket){
		global.sockets.push(socket);
	});
}

exports.run = run;
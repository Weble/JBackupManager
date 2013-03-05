var express = require('express');

// App for the UI
var app = express();

/**
 * Run the UI webserver
 */
function run() {
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
	app.get('/site/:k', obj.edit);
	app.get('/add', obj.edit);
	app.get('/', obj.list);
	app.post('/save/:k', obj.save);
	app.post('/save/', obj.save);
	app.post('/saveconfig', obj.saveconfig);
	app.get('/delete/:k', obj.remove);

	// serve static files
	app.use("/media", express.static(__dirname + '/public'));

	// Launch
	app.listen(3000);
}

exports.run = run;
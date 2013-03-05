var fs = require('node-fs');
var config = require('config');

/**
 * Save the configuration
 */
function save() {
	fs.writeFile('./config/config.json', JSON.stringify(config, null, 4), 'utf-8', function(error){
	});	
}

module.exports = save;
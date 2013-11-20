exports.routes = function (map) {
    
	map.root('sites#index');

    map.resources('crons');
    map.resources('sites');    
    
    map.socket('backup', 'sites#backup');
    map.socket('download', 'sites#download');
    map.socket('deleteCron', 'crons#destroy');
 };
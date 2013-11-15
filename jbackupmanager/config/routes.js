exports.routes = function (map) {
    map.resources('crons');
    map.resources('sites');
    
    map.socket('backup', 'sites#backup');
    map.socket('download', 'sites#download');
 };
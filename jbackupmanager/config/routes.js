exports.routes = function (map) {
    map.resources('sites');
    map.socket('backup', 'sites#backup');
 };
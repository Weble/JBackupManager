// Store all the Browsers connected so we can notify them with Socket.IO
  geddy.io.sockets.on('connection', function(socket){
  	geddy.sockets.push(socket);
  });

geddy.model.Site.restartCronjobs();
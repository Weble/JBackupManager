// Store all the Browsers connected so we can notify them with Socket.IO
  geddy.io.sockets.on('connection', function(socket){
  	geddy.sockets.push(socket);
  });


	Site.on('save', function(){
  	console.log(this);
  	if (this.url && this.key) {
  		this.getAllBackups();
  	}
  });
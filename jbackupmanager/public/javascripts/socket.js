jQuery(function ($) {
	$(document).ready(function(){
		window.socket = io.connect('/');
	    
	    $('[data-trigger]').click(function(){
	    	var data = $(this).data();
	    	window.socket.emit(data.trigger, data);    
	    });

	    window.socket.on('backup-step', function(data){
	    	$('[data-id="'+data.key+'"].progress').show();
	        $('[data-id="'+data.key+'"] .bar').css({width: data.percentage + '%'});
	    });

	    window.socket.on('backup-completed', function(data){
	     	$('[data-trigger="backup"]').removeAttr('disabled');
	        $('[data-id="'+data.key+'"].progress').hide();
	        $('[data-id="'+data.key+'"] .bar').css({width: '0%'});
	    });

	    window.socket.on('download-step', function(data){
	    	$('[data-id="'+data.id+'"].progress').show();
	        $('[data-id="'+data.id+'"] .bar').css({width: data.percentage + '%'});
	    });

	    window.socket.on('download-completed', function(data){
	    	console.log(data);
	     	$('[data-trigger="download"]').removeAttr('disabled');
	        $('[data-id="'+data.id+'"].progress').hide();
	        $('[data-id="'+data.id+'"] .bar').css({width: '0%'});
	    });
	})
});
var ServerClass = function() {
	var NEW_LABELS = 'a';
	var FRAME_OK = 'b';
	var NEW_IMAGE = 'c';
	var SEEK_FRAME = 'd';
	var serv_ws = new WebSocket("ws://" + window.location.host + ":8532");
	var self = this;

	var buffer = [];
	var MAX_BUFFER = 100;

	var ws_handler = function(msg) {
	    if (msg.data[0] == NEW_IMAGE) {
	    	var data = "data:image/jpeg;base64," + msg.data.substr(1);
	    	buffer.push({frame: queryFrame, data: data});
	    	if (buffer.length > MAX_BUFFER)
	    		buffer.splice(0, MAX_BUFFER - buffer.length);
	    	self.onFrameReady.forEach(function(f) { f(data); });
	        // $("#videoframe").css("background-image", "url(\"" + "data:image/jpeg;base64," + msg.data.substr(1) + "\")")
	        //     .css("background-size", "100% 100%");
	        // $("#nextFrame").css("display", "inline-block");
	    }
	    if (msg.data[0] == SEEK_FRAME) {
	        $("#nextFrame").css("display", "none");
	        var frame = JSON.parse(msg.data.substr(1)).frame;
	    }
	    if (callBack != null)
	    	callBack();
	    callBack = null;
	};
	serv_ws.onmessage = ws_handler;
	var sendMessage = function(data) {
	    if (serv_ws.readyState == serv_ws.OPEN)
	        serv_ws.send(data);
	    else if (serv_ws.readyState == serv_ws.CONNECTING) {
	        var prevOnOpen = serv_ws.onopen;
	        serv_ws.onopen = function() {
	            if (prevOnOpen != null)
	                prevOnOpen();
	            serv_ws.send(data);
	        };
	    } else {
	        serv_ws = new WebSocket("ws://" + window.location.host + ":8532");
	        serv_ws.onmessage = ws_handler;
	        sendMessage(data);
	    }
	};
	var callBack;
	var queryFrame = 0;

	this.getFrame = function(frame, cBack) {
		var bf = buffer.reduce(function(acc, bf) { 
			return bf.frame == frame ? bf : acc;
		}, null);
		if (bf == null) {
			queryFrame = frame;
			sendMessage(NEW_LABELS + JSON.stringify({frame: frame, tracks: []}));
			callBack = cBack;	
		} else {
			self.onFrameReady.forEach(function(f) { f(bf.data); });
			cBack();
		}
	};

	this.sendPoints = function(data, cBack) {
		buffer = buffer.filter(function(bf) { 
			return bf.frame < data.frame;
		});
		queryFrame = data.frame;
		callBack = cBack;
		sendMessage(NEW_LABELS + JSON.stringify(data));
	};

	this.onFrameReady = [];
};

var Server = new ServerClass();
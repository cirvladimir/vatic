var ServerClass = function() {
	var NEW_LABELS = 'a';
	var FRAME_OK = 'b';
	var NEW_IMAGE = 'c';
	var SEEK_FRAME = 'd';
	var serv_ws = new WebSocket("ws://localhost:8532");
	var self = this;
	var ws_handler = function(msg) {
	    if (msg.data[0] == NEW_IMAGE) {
	    	self.onFrameReady.forEach(function(f) { f("data:image/jpeg;base64," + msg.data.substr(1)); });
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
	        serv_ws = new WebSocket("ws://localhost:8532");
	        serv_ws.onmessage = ws_handler;
	        sendMessage(data);
	    }
	};
	var callBack;

	this.getFrame = function(frame, cBack) {
		sendMessage(NEW_LABELS + JSON.stringify({frame: frame, tracks: []}));
		callBack = cBack;
	};

	this.sendPoints = function(data, cBack) {
		callBack = cBack;
		sendMessage(NEW_LABELS + JSON.stringify(data));
	};

	this.onFrameReady = [];
};

var Server = new ServerClass();
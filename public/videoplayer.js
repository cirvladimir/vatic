/*
 * var videoplayer = VideoPlayer($("#frame"), 1000,
 *                   function (x) { return "/images/" + x + ".jpg"; });
 * videoplayer.play();
 */
function VideoPlayer(handle, job)
{
    var me = this;

    this.handle = handle;
    this.job = job;
    this.frame = job.start;
    this.paused = true;
    this.fps = 15; // changed from normal (30) to slow (15)
    this.playdelta = 1;

    this.onplay = []; 
    this.onpause = []; 
    this.onupdate = [];

    this.onloaing = [];
    this.onready = [];

    this.overlay_frame = true;
    this.loading_frame = false;
    this.need_to_load = false;

    Server.onFrameReady.push(function(img) {
        me.handle.css("background-image", "url('" + img + "')");
        _callback(me.onready);
        me.loading_frame = false;
    });

    /*
     * Toggles playing the video. If playing, pauses. If paused, plays.
     */
    this.toggle = function()
    {
        if (this.paused)
        {
            this.play();
        }
        else
        {
            this.pause();
        }
    }

    /*
     * Starts playing the video if paused.
     */
    this.play = function()
    {
        if (this.paused)
        {
            console.log("Playing...");
            this.paused = false;
            var fPlay =  function() {
                if (me.frame >= me.job.stop)
                {
                    me.pause();
                }
                else
                {
                    var time = new Date().getTime();
                    me.displace(me.playdelta, function() {
                        var dt = new Date().getTime() - time;
                        if (!me.paused)
                            window.setTimeout(fPlay, 1000 / me.fps - dt); 
                    });
                }
            };
            fPlay();

            _callback(this.onplay);
        }
    }

    /*
     * Pauses the video if playing.
     */
    this.pause = function()
    {
        if (!this.paused)
        {
            console.log("Paused.");
            this.paused = true;

            _callback(this.onpause);
        }
    }

    /*
     * Seeks to a specific video frame.
     */
    this.seek = function(target, cBack)
    {
        this.frame = target;
        this.updateframe(cBack);
    }

    /*
     * Displaces video frame by a delta.
     */
    this.displace = function(delta, cBack)
    {
        this.frame += delta;
        this.updateframe(cBack);
    }

    /*
     * Updates the current frame. Call whenever the frame changes.
     */
    this.updateframe = function(cBack)
    {
        me.need_to_load = true;
        if (!me.loading_frame) {
            me.need_to_load = false;
            me.loading_frame = true;
            me.frame = Math.min(me.frame, me.job.stop);
            me.frame = Math.max(me.frame, me.job.start);
            _callback(me.onloaing);
            if (me.overlay_frame) {
                Server.getFrame(me.frame, function() {
                    _callback(me.onupdate);
                    if (cBack != null)
                        cBack();
                    if (me.need_to_load) {
                        me.updateframe();
                    }
                });
            } else {
                var url = me.job.frameurl(me.frame);
                me.handle.css("background-image", "url('" + url + "')");

                _callback(me.onupdate);
                me.loading_frame = false;
                if (cBack != null)
                    cBack();
            }
        }
    }

    /*
     * Calls callbacks
     */
    var _callback = function(list)
    {
        for (var i = 0; i < list.length; i++)
        {
            list[i]();
        }
    }

    this.updateframe();
}

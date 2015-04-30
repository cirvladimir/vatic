var ui_disabled = 0;

function ui_build(job)
{
    var screen = ui_setup(job);
    var videoframe = $("#videoframe");
    var player = new VideoPlayer(videoframe, job);
    var tracks = new TrackCollection(player, job);
    var objectui = new TrackObjectUI($("#newobjectbutton"), $("#objectcontainer"), videoframe, job, player, tracks);

    ui_setupbuttons(job, player, tracks);
    ui_setupslider(player);
    ui_setupsubmit(job, tracks, player);
    ui_setupclickskip(job, player, tracks, objectui);
    ui_setupkeyboardshortcuts(job, player);
    ui_loadprevious(job, objectui);

    $("#newobjectbutton").click(function() {
        if (!mturk_submitallowed())
        {
            $("#turkic_acceptfirst").effect("pulsate");
        }
    });

    job.inactive = 0;
    /*window.setInterval(function(){
        if (mturk_isoffline())
        {
            job.inactive++;
            if (job.inactive > 2){
                job.autosave = true;
                $("#submitbutton").click();
                job.autosave = false;
                job.inactive = 0;
            }
        }
    },60000);*/
}

function ui_setup(job)
{
    var screen = $("<div id='annotatescreen'></div>").appendTo(container);

    screen.mousemove(function(event){
        job.inactive = 0;
    });

    screen.css("width", "100%");

    $("<table>" +
        "<tr>" +
            "<td style='width: 300px'> </td>" +
            "<td><div id='instructionsbutton' class='button'>Instructions</div>" +
            //<2012-12-03> modified 3 lines for Ben Sapp's application
            //"<div id='instructions'>Annotate every visible body joints for the <strong>" +
			//job.action.replace(/_/g, " ") +
			//"</strong> action across the entire video." +
            "<div id='instructions'>Annotate every visible upper body joints across the entire video" +
            "<br/> <strong> for the person marked by the green box in the small image on the right side </strong> </td>" +
            "<td><div id='topbar'></div></td>" +
        "</tr>" +
        "<tr>" +
              "<td>" + '<img src="boxmodel.png" display="inline" width="350px"></div>' + "</td>" +
              "<td><div id='videoframe'></div></td>" +
              "<td rowspan='4'><div id='sidebar'></div></td>" +
          "</tr>" +
          "<tr>" +
            "<td></td>" +
              "<td><div id='bottombar'></div></td>" +
          "</tr>" +
          "<tr>" +
            "<td></td>" +
              "<td><div id='advancedoptions'></div>" +
              "</td>" +
          "</tr>" +
          "<tr>" +
            "<td></td>" +
              "<td><!--<div>Comments:</div>-->" +
              "<textarea id='commentarea' />" +
              "<div id='submitbar'></div><br/><br/>"+
              '<div><ul class="keyboardshortcuts" display="inline" >' +
              '<li><code>n</code>  creates a new human joint</li>' +
              '<li><code>t</code>  toggles play/pause on the video</li>' +
              '<li><code>r</code>  rewinds the video to the start</li>' +
              '<li><code>f</code>  jump forward 5 frames</li>' +
              '<li><code>d</code>  jump backward 5 frames</li>' +
              '<li><code>v</code>  step forward 1 frame</li>' +
              '<li><code>c</code>  step backward 1 frame</li>' +
              '</ul>'+

              //'<img src="body_joint_fig.jpg" display="inline" width="350px"></div>' +
              //'<img src="boxmodel.png" display="inline" width="350px"></div>' +
              "</td>" +
          "</tr>" +

      "</table>").appendTo(screen).css("width", "100%");


    $("#videoframe").css({"width": job.width + "px",
                          "height": job.height + "px",
                          "margin": "0 auto" })
                    .parent().css("width", Math.max("720", job.width) + "px");
    $("#commentarea").css({"width": Math.max("720", job.width) + "px",
                            "height": "100 px",
                            "margin": "15 auto",
							"resize": "none"}).hide();
    $("#sidebar").css("height", 600 + "px");

    //$("#openadvancedoptions").css("float","right").css("clear","both");

    $("#bottombar").append("<div id='playerslider'></div>");
    $("#bottombar").append("<div class='button' id='rewindbutton'>Rewind</div> ");
    $("#bottombar").append("<div class='button' id='backwardbutton'> &nbsp;  </div> ");
    $("#bottombar").append("<div class='button' id='playbutton'>Play</div> ");
    $("#bottombar").append("<div class='button' id='forwardbutton'> &nbsp; </div> ");

    $("#topbar").append("<div id='newobjectcontainer'>" +
        "<div class='button' id='newobjectbutton'>New Joint</div></div>");


    // subject orientation radio box, added by menglong
    //$("#sidebar").append(
            //"<div id='orientation'>" +
            //"<label>Person Orientation:</label>" +
            //"<input type='radio' id='orientfront' name='orientation' value='1' >" +
            //"<label for='orientfront'>front</label>" +
            //"<input type='radio' id='orientback' name='orientation'  value='2' >" +
            //"<label for='orientback'>back</label>" +
            //"<input type='radio' id='orientleft' name='orientation'  value='3' >" +
            //"<label for='orientleft'>left</label>" +
            //"<input type='radio' id='orientright' name='orientation' value='4' >" +
            //"<label for='orientright'>right</label>" +
            //"</div>");

    //$("#sidebar#orientation").hide();
    $("<div id='objectcontainer'></div>").appendTo("#sidebar");

    $("textarea#commentarea").val(job.comment);

    $("<div class='button' id='openadvancedoptions'>Options</div>")
        .button({
            icons: {
                primary: "ui-icon-wrench"
            }
        }).appendTo($("#advancedoptions").parent()).click(function() {
                eventlog("options", "Show advanced options");
                $(this).remove();
                $("#advancedoptions").show();
            });

    $("#advancedoptions").hide();

    $("#advancedoptions").append(
    "<!--<input type='checkbox' id='annotateoptionsresize'>" +
    "<label for='annotateoptionsresize'>Disable Resize?</label>--> " +
    "<input type='checkbox' id='annotateoptionshideboxes'>" +
    "<label for='annotateoptionshideboxes'>Hide Circles?</label> " +
    "<input type='checkbox' id='annotateoptionshideboxtext' checked='checked'>" +
    "<label for='annotateoptionshideboxtext'>Hide Labels?</label> ");

    $("#advancedoptions").append(
    "<div id='speedcontrol'>" +
    "<input type='radio' name='speedcontrol' " +
        "value='5,1' id='speedcontrolslower'>" +
    "<label for='speedcontrolslower'>Slower</label>" +
    "<input type='radio' name='speedcontrol' " +
        "value='15,1' id='speedcontrolslow' checked='checked'>" +
    "<label for='speedcontrolslow'>Slow</label>" +
    "<input type='radio' name='speedcontrol' " +
        "value='30,1' id='speedcontrolnorm'>" +
    "<label for='speedcontrolnorm'>Normal</label>" +
    "<input type='radio' name='speedcontrol' " +
        "value='90,1' id='speedcontrolfast'>" +
    "<label for='speedcontrolfast'>Fast</label>" +
    "</div>");


    $("#submitbar").append("<div id='submitbutton' class='button'>Submit HIT</div>");

    $("#submitbar").append("<div id='sendframebutton' class='button'>Send Frame</div>");

    if (mturk_isoffline())
	{
		$("#submitbutton").html("Save Work");
		$("#sendframebutton").html("Send Frame");
		//$("#submitbar").append("<div id='nextbutton' class='button'>next</div>");
    }

    return screen;
}

function loadnext(job) {
    var nextId = job.jobid+1;
    document.location.href='/?id='+ nextId + '&hitId=offline';
    //$('#nextbutton').button({
    //	icons: {
    //	primary: 'ui-icon-check'
    //	}
    //}).click(function() {
    //	document.location.href='/?id='+ nextId + '&hitId=offline';
    //});
}

function ui_setupbuttons(job, player, tracks)
{
    $("#instructionsbutton").click(function() {
        player.pause();
        ui_showinstructions(job);
    }).button({
        icons: {
            primary: "ui-icon-newwin"
        }
    });

    $("#playbutton").click(function() {
        if (!$(this).button("option", "disabled"))
        {
            player.toggle();

            if (player.paused)
            {
                eventlog("playpause", "Paused video");
            }
            else
            {
                eventlog("playpause", "Play video");
            }
        }
    }).button({
        disabled: false,
        icons: {
            primary: "ui-icon-play"
        }
    });

    $("#rewindbutton").click(function() {
        if (ui_disabled) return;
        player.pause();
        player.seek(player.job.start);
        eventlog("rewind", "Rewind to start");
    }).button({
        disabled: true,
        icons: {
            primary: "ui-icon-seek-first"
        }
    });

    $("#forwardbutton").click(function() {
        if (ui_disabled) return;
        var skip = job.skip > 0 ? job.skip : 1;
        player.pause();
        player.displace(skip);
        ui_snaptokeyframe(job, player);
        eventlog("forward", "seek next");
    }).button({
        disabled: false,
        icons: {
            primary: "ui-icon-seek-next"
        }
    });

    $("#backwardbutton").click(function() {
        if (ui_disabled) return;
        var skip = job.skip > 0 ? -job.skip : -1;
        player.pause();
        player.displace(skip);
        ui_snaptokeyframe(job, player);
        eventlog("backward", "seek previous");
    }).button({
        disabled: false,
        icons: {
            primary: "ui-icon-seek-prev"
        }
    });

/*
    $("#startbutton").click(function() {
        eventlog("backward", "seek previous");
    }).button({
        disabled: true,
        icons: {
            primary: "ui-icon-seek-prev"
        }
    });
/*
    $("#startbutton").click(function() {
        if (player.frame >= job.actionstop) {
            window.alert("action start shouldn't be later than stop");
            return;
        }

        //if (window.confirm("action start from this frame?")) {
            job.actionstart = player.frame;
            if (job.actionstop < job.actionstart){
                job.actionstop = job.actionstart;
            }
            player.updateSliderValid();
        //}
    }).button({disabled: false});

    $("#stopbutton").click(function() {
        if (player.frame <= job.actionstart) {
            window.alert("action stop shouldn't be ealier than start");
            return;
        }

        //if (window.confirm("action stop from this frame?")){
            job.actionstop = player.frame;
            player.updateSliderValid();
        //}
    }).button({disabled: false});
*/

    player.onplay.push(function() {
        $("#playbutton").button("option", {
            label: "Pause",
            icons: {
                primary: "ui-icon-pause"
            }
        });
    });

    player.onpause.push(function() {
        $("#playbutton").button("option", {
            label: "Play",
            icons: {
                primary: "ui-icon-play"
            }
        });
    });

    player.onupdate.push(function() {
        if (player.frame == player.job.stop)
        {
            $("#playbutton").button("option", "disabled", true);
        }
        else if ($("#playbutton").button("option", "disabled"))
        {
            $("#playbutton").button("option", "disabled", false);
        }

        if (player.frame == player.job.start)
        {
            $("#rewindbutton").button("option", "disabled", true);
        }
        else if ($("#rewindbutton").button("option", "disabled"))
        {
            $("#rewindbutton").button("option", "disabled", false);
        }

    });

    $("#speedcontrol").buttonset();
    $("input[name='speedcontrol']").click(function() {
        player.fps = parseInt($(this).val().split(",")[0]);
        player.playdelta = parseInt($(this).val().split(",")[1]);
        console.log("Change FPS to " + player.fps);
        console.log("Change play delta to " + player.playdelta);
        if (!player.paused)
        {
            player.pause();
            player.play();
        }
        eventlog("speedcontrol", "FPS = " + player.fps + " and delta = " + player.playdelta);
    });

    // added by menglong
    //$("#orientation").buttonset();
    //$("input[name='orientation']").click(function() {
    //    job.orientation = parseInt($(this).val());
    //    console.log("orientation set to:" + job.orientation);
    //});

    $("#commentarea").focusin(function() {
        ui_disabled = true;
        console.log("ui disabled");
    });

    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g,"");
    }
    String.prototype.ltrim = function() {
        return this.replace(/^\s+/,"");
    }
    String.prototype.rtrim = function() {
        return this.replace(/\s+$/,"");
    }

    String.prototype.removelinebreak = function() {
        return this.replace(/(\r\n|\n|\r)/gm,"  ");
    }

    String.prototype.delquote = function() {
        return this.replace(/["']{1}/gi,"&quot;");
    }

    $("#commentarea").focusout(function() {
        ui_disabled = false;
        console.log("ui enabled");
        job.comment = ($(this).val()).removelinebreak().delquote();
        console.log("comment added:" + job.comment);
    });


    $("#annotateoptionsresize").button().click(function() {
	    // menglong. added to disable resize
        eventlog("disableresize", "Objects resize disabled");
	    return;

	   // var resizable = !$(this).attr("checked");
       // tracks.resizable(resizable);

       // if (resizable)
       // {
       //     eventlog("disableresize", "Objects can be resized");
       // }
       // else
       // {
       //     eventlog("disableresize", "Objects can not be resized");
       // }

    });

    $("#annotateoptionshideboxes").button().click(function() {
        var visible = !$(this).attr("checked");
        tracks.visible(visible);

        if (visible)
        {
            eventlog("hideboxes", "Boxes are visible");
        }
        else
        {
            eventlog("hideboxes", "Boxes are invisible");
        }
    });

    $("#annotateoptionshideboxtext").button().click(function() {
        var visible = !$(this).attr("checked");

        if (visible)
        {
            $(".boundingboxtext").show();
        }
        else
        {
            $(".boundingboxtext").hide();
        }
    });
}

function ui_setupkeyboardshortcuts(job, player)
{
    $(window).keypress(function(e) {
        console.log("Key press: " + e.keyCode);

        if (ui_disabled)
        {
            console.log("Key press ignored because UI is disabled.");
            return;
        }

        var keycode = e.keyCode ? e.keyCode : e.which;
        eventlog("keyboard", "Key press: " + keycode);

        if (keycode == 32 || keycode == 112 || keycode == 116 || keycode == 98)
        {
            $("#playbutton").click();
        }
        if (keycode == 114)
        {
            $("#rewindbutton").click();
        }
        else if (keycode == 110)
        {
            $("#newobjectbutton").click();
        }
        else if (keycode == 104)
        {
            $("#annotateoptionshideboxes").click();
        }
        else if (keycode == 106)
        {
//            $("#startbutton").click();
        }
        else if (keycode == 107)
        {
//            $("#stopbutton").click();
        }
        else
        {
            var skip = 0;
            if (keycode == 44 || keycode == 100)
            {
                skip = job.skip > 0 ? -job.skip : -5;
            }
            else if (keycode == 46 || keycode == 102)
            {
                skip = job.skip > 0 ? job.skip : 5;
            }
            else if (keycode == 62 || keycode == 118)
            {
                skip = job.skip > 0 ? job.skip : 1;
            }
            else if (keycode == 60 || keycode == 99)
            {
                skip = job.skip > 0 ? -job.skip : -1;
            }

            if (skip != 0)
            {
                player.pause();
                player.displace(skip);

                ui_snaptokeyframe(job, player);
            }
        }
    });

}

function ui_canresize()
{
    return !$("#annotateoptionsresize").attr("checked");
}

function ui_areboxeshidden()
{
    return $("#annotateoptionshideboxes").attr("checked");
}

function ui_setupslider(player)
{
    var slider = $("#playerslider");
    slider.slider({
        range: "min",
        value: player.job.start,
        //values: [player.job.actionstart, player.job.actionstart],
        min: player.job.start,
        max: player.job.stop,
        slide: function(event, ui) {
            player.pause();
            player.seek(ui.value);
            // probably too much bandwidth
            //eventlog("slider", "Seek to " + ui.value);
        }
    });

    //slider.children(".ui-slider-handle").css("border-color");
    slider.children(".ui-slider-range").css({
        "background-color": "white",//"#868686",
        "background-image": "none"});

    slider.css({
        marginTop: "6px",
        marginRight: "8px",
        width: "430px",
        float: "right"
    });

    originalSlider = slider.children(".ui-slider-range");
    sliderRange = originalSlider.clone();
    sliderRange.width(0);
    sliderRange.css("background-color","orange");
    //player.sliderRangeStart = sliderRange;
    //player.sliderRangeStop = sliderRange.clone();
    player.sliderRangeValid = sliderRange.clone();

    player.sliderRangeValid.appendTo(slider);

    //player.updateSliderStart = function() {
    //    if (player.job.actionstart > player.job.start) {
    //            var leftoffset = ((player.job.actionstart - player.job.start)/
    //                (player.job.stop - player.job.start))*player.sliderRangeStart.parent().width();
    //            player.sliderRangeStart.width(leftoffset);
    //    }
    //}

    //player.updateSliderStop = function() {
    //    if (player.job.actionstop > player.job.actionstart) {
    //            var leftoffset = ((player.job.actionstop - player.job.start)/
    //                (player.job.stop - player.job.start))*player.sliderRangeStop.parent().width();
    //            var width = player.sliderRangeStop.parent().width() - leftoffset;
    //            player.sliderRangeStop.css({"left": leftoffset, "width": width});
    //    }
    //}

    player.updateSliderValid = function() {
        //if (player.job.actionstart > player.job.start ) {
            var leftoffset = ((player.job.actionstart - player.job.start)/
                    (player.job.stop - player.job.start))*player.sliderRangeValid.parent().width();

            var rightoffset = ((player.job.actionstop - player.job.start)/
                    (player.job.stop - player.job.start))*player.sliderRangeValid.parent().width();
            width = rightoffset - leftoffset;
            player.sliderRangeValid.css({"left": leftoffset, "width": width});
        //}
    }

    player.updateSliderValid();

    player.onupdate.push(function() {
        slider.slider({value:  player.frame});
    });
}

function ui_iskeyframe(frame, job)
{
    return frame == job.stop || (frame - job.start) % job.skip == 0;
}

function ui_snaptokeyframe(job, player)
{
    if (job.skip > 0 && !ui_iskeyframe(player.frame, job))
    {
        console.log("Fixing slider to key frame");
        var remainder = (player.frame - job.start) % job.skip;
        if (remainder > job.skip / 2)
        {
            player.seek(player.frame + (job.skip - remainder));
        }
        else
        {
            player.seek(player.frame - remainder);
        }
    }
}

function ui_setupclickskip(job, player, tracks, objectui)
{
    if (job.skip <= 0)
    {
        return;
    }

    player.onupdate.push(function() {
        if (ui_iskeyframe(player.frame, job))
        {
            console.log("Key frame hit");
            player.pause();
            $("#newobjectbutton").button("option", "disabled", false);
            $("#playbutton").button("option", "disabled", false);
            tracks.draggable(true);
            //tracks.resizable(ui_canresize());
            tracks.resizable(false);
            tracks.recordposition();
            objectui.enable();
        }
        else
        {
            $("#newobjectbutton").button("option", "disabled", true);
            $("#playbutton").button("option", "disabled", true);
            tracks.draggable(false);
            tracks.resizable(false);
            objectui.disable();
        }
    });

    $("#playerslider").bind("slidestop", function() {
        ui_snaptokeyframe(job, player);
    });
}

function ui_loadprevious(job, objectui)
{
    var overlay = $('<div id="turkic_overlay"></div>').appendTo("#container");
    var note = $("<div id='submitdialog'>One moment...</div>").appendTo("#container");

    server_request("getboxesforjob", [job.jobid], function(data) {
        overlay.remove();
        note.remove();

        for (var i in data)
        {
            objectui.injectnewobject(data[i]["label"],
                                     data[i]["boxes"],
                                     data[i]["attributes"]);
        }
    });
}

function ui_setupsubmit(job, tracks, player)
{
    $("#submitbutton").button({
        icons: {
            primary: 'ui-icon-check'
        }
    }).click(function() {
        if (ui_disabled) return;
        ui_submit(job, tracks);
    });
    $("#sendframebutton").button()
        .click(function() {
            /*var a = tracks;
            var b = job;
            var c = player;*/

            var url = server_geturl("sendframe", [job.jobid]);
            console.log("Server post: " + url);
            data = JSON.stringify({ frame: player.frame, tracks: tracks.tracks.filter(function(tr) {
                   return (!tr.deleted) && tr.handle.is(":visible");
               }).map(function(tr) {
                   return {label : tr.label, position:  tr.pollposition()};
               })});
            var a = player;

            var req = new XMLHttpRequest();
            req.open("POST", url, true);
            req.contentType = "text/json";
            req.responseType = "arraybuffer";

            req.onload = function (oEvent) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    //$("<image height='100' width='100'/>").appendTo(document.body).attr("src", "data:image/jpeg" + e.target.result.substr(5));
                    $("#videoframe").css("background-image", "url(\"" + "data:image/jpeg" + e.target.result.substr(5) + "\")")
                        .css("background-size", "100% 100%");

                };
                var blob = new Blob([req.response]);
                reader.readAsDataURL(blob);
            };

            req.send(data);

        });
}

function ui_submit(job, tracks)
{
    console.dir(tracks);
//    console.log("actionstart: " + job.actionstart);
//    console.log("actionstop: " + job.actionstop);
    console.log("Start submit - status: " + tracks.serialize());

    completeinfo = "[[" + job.actionstart + "],[" + job.actionstop + "],["
        + job.orientation + "],[\"" + job.comment + "\"]," + tracks.serialize() + "]";

    console.log("full info: " + completeinfo);

    if (!mturk_submitallowed())
    {
        alert("Please accept the task before you submit.");
        return;
    }

    /*if (mturk_isassigned() && !mturk_isoffline())
    {
        if (!window.confirm("Are you sure you are ready to submit? Please " +
                            "make sure that the entire video is labeled and " +
                            "your annotations are tight.\n\nTo submit, " +
                            "press OK. Otherwise, press Cancel to keep " +
                            "working."))
        {
            return;
        }
    }*/

    var overlay = $('<div id="turkic_overlay"></div>').appendTo("#container");
    ui_disable();

    var note = $("<div id='submitdialog'></div>").appendTo("#container");

    function validatejob(callback)
    {
        server_post("validatejob", [job.jobid], tracks.serialize(),
            function(valid) {
                if (valid)
                {
                    console.log("Validation was successful");
                    callback();
                }
                else
                {
                    note.remove();
                    overlay.remove();
                    ui_enable();
                    console.log("Validation failed!");
                    ui_submit_failedvalidation();
                }
            });
    }

    function respawnjob(callback)
    {
        server_request("respawnjob", [job.jobid], function() {
            callback();
        });
    }

    function savejob(callback)
    {
        server_post("savejob1", [job.jobid],
            completeinfo , // tracks.serialize()
            function(data) {
                callback()
            });
    }

    function finishsubmit(redirect)
    {
        if (mturk_isoffline())
        {
            window.setTimeout(function() {
                note.remove();
                overlay.remove();
                ui_enable();
                //loadnext(job);
            }, 1000);
        }
        else
        {
            window.setTimeout(function() {
                redirect();
            }, 1000);
        }
    }

    function autosave()
    {
        window.setTimeout(function() {
                note.remove();
                overlay.remove();
                ui_enable();
                }, 1000);
    }

    if (job.autosave)
    {
        note.html("Auto Saving...");
        savejob(function() {
                note.html("Auto Saved!");
                autosave();
                });
    }
    else
    {
        if (job.training)
        {
            console.log("Submit redirect to train validate");

            note.html("Checking...");
            validatejob(function() {
                    savejob(function() {
                        mturk_submit(function(redirect) {
                            respawnjob(function() {
                                note.html("Good work!");
                                finishsubmit(redirect);
                                });
                            });
                        });
                    });
        }
        else
        {
            note.html("Saving...");
            savejob(function() {
                    mturk_submit(function(redirect) {
                        note.html("Saved!");
                        finishsubmit(redirect);
                        });
                    });
        }
    }
}

function ui_submit_failedvalidation()
{
    $('<div id="turkic_overlay"></div>').appendTo("#container");
    var h = $('<div id="failedverificationdialog"></div>')
    h.appendTo("#container");

    h.append("<h1>Low Quality Work</h1>");
    h.append("<p>Sorry, but your work is low quality. We would normally <strong>reject this assignment</strong>, but we are giving you the opportunity to correct your mistakes since you are a new user.</p>");

    h.append("<p>Please review the instructions, double check your annotations, and submit again. Remember:</p>");

    var str = "<ul>";
    str += "<li>You must label every visible joints.</li>";
    str += "<li>You must annotate the joints as precise as possible.</li>";
    str += "</ul>";

    h.append(str);

    h.append("<p>When you are ready to continue, press the button below.</p>");

    $('<div class="button" id="failedverificationbutton">Try Again</div>').appendTo(h).button({
        icons: {
            primary: "ui-icon-refresh"
        }
    }).click(function() {
        $("#turkic_overlay").remove();
        h.remove();
    }).wrap("<div style='text-align:center;padding:5x 0;' />");
}

function ui_showinstructions(job)
{
    console.log("Popup instructions");

    if ($("#instructionsdialog").size() > 0)
    {
        return;
    }

    eventlog("instructions", "Popup instructions");

    $('<div id="turkic_overlay"></div>').appendTo("#container");
    var h = $('<div id="instructionsdialog"></div>').appendTo("#container");

    $('<div class="button" id="instructionsclosetop">Dismiss Instructions</div>').appendTo(h).button({
        icons: {
            primary: "ui-icon-circle-close"
        }
    }).click(ui_closeinstructions);

    instructions(job, h)

    ui_disable();
}

function ui_closeinstructions()
{
    console.log("Popdown instructions");
    $("#turkic_overlay").remove();
    $("#instructionsdialog").remove();
    eventlog("instructions", "Popdown instructions");

    ui_enable();
}

function ui_disable()
{
    if (ui_disabled++ == 0)
    {
        $("#newobjectbutton").button("option", "disabled", true);
        $("#playbutton").button("option", "disabled", true);
        $("#rewindbutton").button("option", "disabled", true);
        $("#submitbutton").button("option", "disabled", true);
        $("#playerslider").slider("option", "disabled", true);

        console.log("Disengaged UI");
    }

    console.log("UI disabled with count = " + ui_disabled);
}

function ui_enable()
{
    if (--ui_disabled == 0)
    {
        $("#newobjectbutton").button("option", "disabled", false);
        $("#playbutton").button("option", "disabled", false);
        $("#rewindbutton").button("option", "disabled", false);
        $("#submitbutton").button("option", "disabled", false);
        $("#playerslider").slider("option", "disabled", false);

        console.log("Engaged UI");
    }

    ui_disabled = Math.max(0, ui_disabled);

    console.log("UI disabled with count = " + ui_disabled);
}

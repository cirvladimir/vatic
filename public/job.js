function Job(data)
{
    var me = this;

    this.slug = null;
    this.start = null;
    this.stop = null; 
    this.width = null; 
    this.height = null; 
    this.skip = null; 
    this.perobject = null;
    this.completion = null;
    this.blowradius = null;
    this.thisid = null;
    this.labels = null;

    // added by menglong
    this.orientation = null;
    this.comment = null;
    this.actionstart = null;
    this.actionstop = null;
	this.action = null;
    this.autosave = false;

    this.frameurl = function(i)
    {
        folder1 = parseInt(Math.floor(i / 100));
        folder2 = parseInt(Math.floor(i / 10000));
        return "frames/" + me.slug + 
            "/" + folder2 + "/" + folder1 + "/" + parseInt(i) + ".jpg";
    };

    this.overlay_frameurl = function(i)
    {
        folder1 = parseInt(Math.floor(i / 100));
        folder2 = parseInt(Math.floor(i / 10000));
        return "/server/overlay_frame/" + i;
    };
}

function job_import(data)
{
    var job = new Job();
    job.slug = data["slug"];
    job.start = parseInt(data["start"]);
    job.stop = parseInt(data["stop"]);
    job.width = parseInt(data["width"]);
    job.height = parseInt(data["height"]);
    job.skip = parseInt(data["skip"]);
    job.perobject = parseFloat(data["perobject"]);
    job.completion = parseFloat(data["completion"]);
    job.blowradius = parseInt(data["blowradius"]);
    job.jobid = parseInt(data["jobid"]);
    job.labels = data["labels"];
    job.attributes = data["attributes"];
    job.training = parseInt(data["training"]);

    // added by menglong
    //job.orientation = parseInt(data["orientation"]);
    job.comment = data["comment"];
    if(job.comment == "NULL" || job.comment == "null")
        job.comment = null;
    //job.actionstart = parseInt(data["actionstart"]); // valid action start
    //job.actionstop = parseInt(data["actionstop"]); // valid action stop
    // to only load relevant part of the video sequence
    //job.start = job.actionstart;
    //job.stop = job.actionstop;

	job.action = data["action"]
	
    //if (job.actionstart == 0 && job.actionstop == 0) {
    job.actionstart = job.start;
    job.actionstop = job.stop;
    //}

    if (false) {
        console.log("Job configured!");
        console.log("  Slug: " + job.slug);
        console.log("  Start: " + job.start);
        console.log("  Stop: " + job.stop);
        console.log("  Width: " + job.width);
        console.log("  Height: " + job.height);
        console.log("  Skip: " + job.skip);
        console.log("  Per Object: " + job.perobject);
        console.log("  Blow Radius: " + job.blowradius);
        console.log("  Training: " + job.training);
        console.log("  Job ID: " + job.jobid);
        console.log("  Labels: ");
        for (var i in job.labels)
        {
            console.log("    " + i + " = " + job.labels[i]);
        }
        console.log("  Attributes:");
        for (var i in job.attributes)
        {
            for (var j in job.attributes[i])
            {
                console.log("    " + job.labels[i] + " = " + job.attributes[i][j])
            }
        }
        //console.log("  orientation: " + job.orientation);
        console.log("  comment: " + job.comment);
        console.log("  actionstart: " +job.actionstart);
        console.log("  actionstop: " + job.actionstop);
        console.log("  action: " + job.action);
    }

    return job;
}

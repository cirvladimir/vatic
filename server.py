import os.path, sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ['PYTHON_EGG_CACHE'] = '/webeggs'

import config
from turkic.server import handler, application
from turkic.database import session
import cStringIO
from models import *
import _mysql

import logging
logger = logging.getLogger("vatic.server")

@handler()
def getjob(id, verified):
    job = session.query(Job).get(id)

    logger.debug("Found job {0}".format(job.id))

    if int(verified) and job.segment.video.trainwith:
        # swap segment with the training segment
        training = True
        segment = job.segment.video.trainwith.segments[0]
        logger.debug("Swapping actual segment with training segment")
    else:
        training = False
        segment = job.segment

    video = segment.video
    labels = dict((l.id, l.text) for l in video.labels)

    attributes = {}
    for label in video.labels:
        attributes[label.id] = dict((a.id, a.text) for a in label.attributes)

    logger.debug("Giving user frames {0} to {1} of {2}".format(video.slug,
                                                               segment.start,
                                                               segment.stop))

    return {"start":        segment.start,
            "stop":         segment.stop,
            "slug":         video.slug,
            "width":        video.width,
            "height":       video.height,
            "skip":         video.skip,
            "perobject":    video.perobjectbonus,
            "completion":   video.completionbonus,
            "blowradius":   video.blowradius,
            "jobid":        job.id,
            "training":     int(training),
            "labels":       labels,
            "attributes":   attributes,
#            "orientation":  job.orientation,
            "comment":      job.comment,
            "action":       video.action}
#            "actionstart":  job.actionstart,
#            "actionstop":   job.actionstop}



@handler()
def getboxesforjob(id):
    job = session.query(Job).get(id)
    result = []
    for path in job.paths:
        attrs = [(x.attributeid, x.frame, x.value) for x in path.attributes]
        result.append({"label": path.labelid,
                       "boxes": [tuple(x) for x in path.getboxes()],
                       "attributes": attrs})
    return result

def readpaths(tracks):
    paths = []
    logger.debug("Reading {0} total tracks".format(len(tracks)))

    for label, track, attributes in tracks:
        path = Path()
        path.label = session.query(Label).get(label)
        
        logger.debug("Received a {0} track".format(path.label.text))

        visible = False
        for frame, userbox in track.items():
            box = Box(path = path)
            box.xtl = max(int(userbox[0]), 0)
            box.ytl = max(int(userbox[1]), 0)
            box.xbr = max(int(userbox[2]), 0)
            box.ybr = max(int(userbox[3]), 0)
            box.occluded = int(userbox[4])
            box.outside = int(userbox[5])
            box.frame = int(frame)
            if not box.outside:
                visible = True

            logger.debug("Received box {0}".format(str(box.getbox())))

        if not visible:
            logger.warning("Received empty path! Skipping")
            continue

        for attributeid, timeline in attributes.items():
            attribute = session.query(Attribute).get(attributeid)
            for frame, value in timeline.items():
                aa = AttributeAnnotation()
                aa.attribute = attribute
                aa.frame = frame
                aa.value = value
                path.attributes.append(aa)

        paths.append(path)
    return paths

@handler(post = "json")
def savejob(id, tracks):
    job = session.query(Job).get(id)

    for path in job.paths:
        session.delete(path)
    session.commit()
    for path in readpaths(tracks):
        job.paths.append(path)

    session.add(job)
    session.commit()

@handler(type="image/jpeg")
def test():
    f = open('/home/user/vatic/public/box.jpg', 'rb')
    cont = f.read()
    #if 'wsgi.file_wrapper' in environ:
    #return environ['wsgi.file_wrapper'](f, 1000000)
    #else:
    return cont
    #return iter(lambda: f.read(4096), '')#([("Content-Type", "image/jpeg")], cont)
    #f.read(1)
    #return "aaa" #"here" + str(len(data))
    #sendfile('/home/user/vatic/public/box.jpg')

@handler(type="image/jpeg", post = "json")
def sendframe(id, data):
    str_xys   = ""
    num_points = len(data['tracks'])
    # print("------------------------------------")
    # print("------------------------------------")
    # print("------------------------------------")
    con = _mysql.connect('localhost', 'root', '', 'vatic')
    point_inds = ""
    for labels in data['tracks']:
        # get label index
        con.query("select text from labels where id=%s" % labels['label'])
        res = con.store_result()
        if (res.num_rows() == 0): # no such point in db
            num_points = num_points - 1
            continue
        label_name = res.fetch_row()[0][0]
        point_inds += " %s" % label_name[len(label_name) - 1] # assumes points are named something like Point3
        tmp = "%.2f %.2f " % (labels[str('position')][str('xtl')], labels[str('position')][str('ytl')])
        str_xys = str_xys + (str( tmp))
        
        # print(labels[str('label')])
    args = "/home/user/ObjRecognition/build/client  %d %d %s %s" % (data['frame'], num_points, point_inds, str_xys)
    
    # print(args)
    # print("------------------------------------")
    # print("------------------------------------")
    # print("------------------------------------")
    os.system(args)
    f = open('/home/user/ObjRecognition/build/dartpose.jpg', 'rb')
    cont = f.read()
    return cont

@handler(post = "json")
def savejob1(id, data):
    # data contain comment, orientation, tracks
    job = session.query(Job).get(id)

    # seperate three parts
    #job.actionstart = data[0][0]
    #job.actionstop = data[1][0]
    #job.orientation = data[2][0]
    job.comment = data[3][0]
    if job.comment == "null":
        job.comment = "NULL"
    tracks = data[4]
    
    # delete old path in the database
    for path in job.paths:
        session.delete(path)
    session.commit()
    for path in readpaths(tracks):
        job.paths.append(path)

    session.add(job)
    session.commit()

@handler(post = "json")
def validatejob(id, tracks):
    job = session.query(Job).get(id)
    paths = readpaths(tracks)

    return job.trainingjob.validator(paths, job.trainingjob.paths)

@handler()
def respawnjob(id):
    job = session.query(Job).get(id)

    replacement = job.markastraining()
    job.worker.verified = True
    session.add(job)
    session.add(replacement)
    session.commit()

    replacement.publish()
    session.add(replacement)
    session.commit()

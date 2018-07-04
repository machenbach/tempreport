#!/usr/bin/env python
from datetime import datetime
from datetime import timedelta
import json
import urllib2

from properties import probes, site, probeLabels, urlBase


def getReading(d):           
    date = d.isoformat()
    temps = [25000+probe for probe in probes]
    return { "date" : date, 
             "temps" : temps,
            }

def saveTemp(values):
    try:
        url = "%s/reading/%s" % (urlBase, site)
        data = json.dumps(values)
        req = urllib2.Request(url, data, {"Content-Type": "application/json"})
        response = urllib2.urlopen(req)
        response.read()
    except:
        print "Unexpected error, skipping reading"

def postLabels():
    try:
        url = "%s/label/%s" % (urlBase, site)
        data = json.dumps({"labels": probeLabels} )
        req = urllib2.Request(url, data, {"Content-Type": "application/json"})
        response = urllib2.urlopen(req)
        response.read()
    except:
        print "Unexpected error posting label.  Skipping"


print "Starting Temp Probe"
postLabels()

d = datetime.utcnow();
dt = timedelta(seconds=60)
for x in range(100):
    saveTemp(getReading(d))
    d = d - dt
    
    

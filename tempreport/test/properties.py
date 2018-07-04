'''
Created on Feb 4, 2014

@author: mike
'''
# where we are coming from
site = "innsbruck"

# The probes
probes = [
           0, 
           10 ]
# Probe labels
probeLabels = [ "Indoor", "Outdoor" ]

# url of the temperature service
url = "http://localhost:8080/reporttemp"

# url of the label service
labelUrl = "http://localhost:8080/label"

urlBase = "http://localhost:8080/_ah/api/tempreport/v1"

# delay in seconds between readings
delay = 60

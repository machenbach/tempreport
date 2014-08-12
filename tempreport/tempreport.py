from google.appengine.api import users
from google.appengine.ext import ndb

from datetime import datetime
from datetime import timedelta

import endpoints
from protorpc import messages
from protorpc import message_types
from protorpc import remote



''' Database Entities '''

class TempReading2(ndb.Model):
    """Models an individual Temperature entry with a datetime and temperature."""
    date = ndb.DateTimeProperty("d", indexed = True)
    temps = ndb.IntegerProperty("t", repeated = True, indexed = False)

class Label(ndb.Model):
    labels = ndb.StringProperty('l', repeated = True, indexed = False)


''' This section deals with the REST APIs '''
        
class TempReading(messages.Message):
    date = message_types.DateTimeField(1)
    temps = messages.IntegerField(2, repeated = True)
    
class TempReadings(messages.Message):
    readings = messages.MessageField(TempReading, 1, repeated = True)
    
class LabelMsg(messages.Message):
    labels = messages.StringField(1, repeated = True)
     
@endpoints.api(name='tempreport', version='v1')
class TempReport(remote.Service):

    ''' List the temperatures at the site for a given time range '''    
    # resource container for the readings call
    ReadingsResource = endpoints.ResourceContainer(
            message_types.VoidMessage,
            site=messages.StringField(1),
            hours=messages.IntegerField(2, variant = messages.Variant.INT32))

    @endpoints.method(ReadingsResource, TempReadings,
                      path='readings/{site}/{hours}', http_method='GET',
                      name='tempreading.readings')
    def readings(self, request):
        hours = request.hours if request.hours is not None else 8
        starttime = (datetime.now() + timedelta(minutes=-hours*60))
        dbReadings = TempReading2.query(TempReading2.date >= starttime, ancestor = ndb.Key(TempReading2, request.site)).order(-TempReading2.date).fetch()
        return TempReadings(readings = [TempReading(date = r.date, temps = r.temps) for r in dbReadings])

    ''' Get and Set an individual reading.  '''
    # resource container for to set the reading
    SetReadingResource = endpoints.ResourceContainer(
                TempReading,
                site = messages.StringField(1) )
    
    @endpoints.method(SetReadingResource, message_types.VoidMessage,
                      path="reading/{site}", http_method="POST",
                      name="tempreading.setReading")
    def setReading(self, request):
        tempReading = TempReading2(parent = ndb.Key(TempReading2, request.site))
        tempReading.date = request.date
        tempReading.temps = request.temps
        tempReading.put()
        return message_types.VoidMessage()

    GetReadingResource = endpoints.ResourceContainer(
                message_types.VoidMessage,
                site = messages.StringField(1) )
    
    @endpoints.method(GetReadingResource, TempReading,
                      path="reading/{site}", http_method="GET",
                      name="tempreading.getReading")
    def getReading(self, request):
        dbReading = TempReading2.query(ancestor = ndb.Key(TempReading2, request.site)).order(-TempReading2.date).fetch(1)
        t = TempReading()
        if len(dbReading) > 0:
            t.date = dbReading[0].date
            t.temps = dbReading[0].temps
        return t

    ''' Get and set the labels for a given site '''
    # resource container for to set the reading
    SetLabelResource = endpoints.ResourceContainer(
                LabelMsg,
                site = messages.StringField(1) )
    
    @endpoints.method(SetLabelResource, message_types.VoidMessage,
                      path="label/{site}", http_method="POST",
                      name="tempreading.setLabel")
    def setLabel(self, request):
        lab = Label.get_or_insert(request.site)
        lab.labels = request.labels
        lab.put()
        return message_types.VoidMessage()

    GetLabelResource = endpoints.ResourceContainer(
                message_types.VoidMessage,
                site = messages.StringField(1) )
    
    @endpoints.method(GetReadingResource, LabelMsg,
                      path="label/{site}", http_method="GET",
                      name="tempreading.getLabel")
    def getLabel(self, request):
        label = ndb.Key(Label, request.site).get()
        ret = LabelMsg()
        if label is not None:
            ret.labels = label.labels
        return ret
        

api_endpoint = endpoints.api_server([TempReport])
;(function($, window, document, undefined) {
    "use strict";

    // plugin variables and constructors

    var pluginName = "meetupEventFetcher",
        // TODO: any defaults needed?
        defaults = {
            propertyName: "value"
        };

    var Plugin = function(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);

        this._defaults = defaults;
        this._name = pluginName;

        this._events = [];

        this.init();
    };

    // event constructor

    var Event = function(opts) {
        console.log('event');

        this.name = opts.name;
        this.date = opts.date;
        this.time = opts.time;
        this.url = opts.url;

        this.initialize();
    };

    Event.prototype.initialize = function() {
        console.log('init');

        this.createElement();
    };

    Event.prototype.createElement = function() {
        this.el = '<div class="calendar-details">' +
                    '<a href="' + this.url + '" class="button right">RSVP</a>' +
                    '<p class="title">' + this.name + '</p>' +
                    '<p class="time">' + this.date + ' | ' + this.time + '</p>' +
                    '</div>';

        console.log(this.el);
    };

    // plugin prototypal methods

    $.extend(Plugin.prototype, {
        init: function() {
            console.log("init plugin");

            this.retrieveEvents(this.settings.groupName, this.settings.sigId, this.settings.sig);
        },
        retrieveEvents: function(groupName, sigId, sig) {
            console.log(groupName);

            $.ajax({
                url: 'http://api.meetup.com/2/events',
                type: 'get',
                dataType: 'jsonp',
                data: {
                    status: 'upcoming',
                    order: 'time',
                    limited_events: 'False',
                    group_urlname: groupName,
                    desc: false,
                    offset: 0,
                    // TODO: weird signature literally requires 3 results?
                    page: 3,
                    fields: '',
                    sig_id: sigId,
                    sig: sig
                }
            })
            .done(this.createEvents.bind(this))
            .fail(function(err) {
                console.log('fail', groupName);
                console.log(err);
            });
        },
        createEvents: function(data) {
            var that = this,
                events = data.results;

            console.log(events);

            try {
                $.each(events, function(idx, item) {
                    that._events.push(new Event({
                        name: item.name,
                        date: item.time,
                        time: item.time,
                        url: item.event_url
                    }))

                    console.log(that._events);
                });
            }
            catch(err) {
                console.log(that._name, ': api call failed; check your query params and signature!');
            }

            if (this._events.length) {
                console.log('DO STUFF WITH EVENTS');
            }
        }
    });

    // lightweight plugin wrapper around the constructor, preventing against
    //  multiple instantiations
    $.fn[pluginName] = function(options) {
        return this.each(function() {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin(this, options));
            }
        });
    };
})(jQuery, window, document);



















var MeetupEvent = function(name, date, time, url) {
  this.name = name;
  this.date = date;
  this.time = time;
  this.url = url;
};

MeetupEvent.fromJSON = function(eventJSON) {
  var name = eventJSON.name;
  var dateTime = new Date(eventJSON.time);
  var date = dateTime.toDateString();
  var time = dateTime.toLocaleTimeString().replace(/:\d+ /, ' ');
  var  url = eventJSON.event_url;

  return new MeetupEvent(name, date, time, url);
};

MeetupEvent.upcomingEvent = function(meetupGroupName) {
  var name = 'Upcoming DBCx Speaker Event'
  var dateTime = 'TBD';
  var date = 'TBD';
  var time = 'TBD';
  var url = 'http://www.meetup.com/' + meetupGroupName;

  return new MeetupEvent(name, date, time, url);
};

MeetupEvent.prototype.toHTML = function() {
  var html = "<div class=\"calendar-details\">"
             + "<a href=\"" + this.url + "\" class=\"button right\">RSVP</a>"
             + "<p class=\"title\">" + this.name + "</p>"
             + "<p class=\"time\">" + this.date + " | " + this.time + "</p>"
             + "</div>";
  return html;
};

var MeetupEventHandler = {
  responseHandler: function(json) {
    var events = MeetupEventHandler.parseEvents(json);
    var addedEvents = MeetupEventHandler.addExtraEvents(events, this.meetupGroupName);
    MeetupEventHandler.renderEvents(addedEvents, $("#" + this.location + "-meetup-calendar"));
  },
  parseEvents: function(json) {
    var events = [];
    $.each(json.results, function(index, event) {
        events.push(MeetupEvent.fromJSON(event));
    });
    return events;
  },
  addExtraEvents: function(events, meetupGroupName) {
    while (events.length < 3) {
        events.push(MeetupEvent.upcomingEvent(meetupGroupName));
    }
    return events;
  },
  renderEvents: function(events, $container) {
    var html = "";
    $.each(events, function(index, event) {
        html = html + event.toHTML();
    });
    $container.html(html);
  }
};

var MeetupAPI = {
  baseUrl: "http://api.meetup.com/2/",
  fetch: function(query, callback) {
      $.ajax({url: MeetupAPI.baseUrl + query,
              type: 'GET',
              dataType: 'jsonp',
              success: callback});
  }
};

$(function() {

  var locations = [
    {signedQuery: "events?status=upcoming&order=time&limited_events=False&group_urlname=Chicago-DevBootcamp-Speaker-Series&desc=false&offset=0&format=json&page=3&fields=&sig_id=145924542&sig=cb896554dd276f6f96dd553a21991866442a76c9",
     location: "chi",
     meetupGroupName: "Chicago-DevBootcamp-Speaker-Series"},
    {signedQuery: "events?status=upcoming&order=time&limited_events=False&group_urlname=DBCx-SF-Dev-Bootcamp-San-Francisco-Open-Learning&desc=false&offset=0&format=json&page=3&fields=&sig_id=145924542&sig=466e0496a29517e76fea5f07ada41d6e3c12a4b5",
     location: "sf",
     meetupGroupName: "DBCx-SF-Dev-Bootcamp-San-Francisco-Open-Learning"},
    {signedQuery: "events?status=upcoming&order=time&limited_events=False&group_urlname=DBCx-NYC&desc=false&offset=0&format=json&page=3&fields=&sig_id=145924542&sig=bef28184f250102d74b824425bcc1860f17519a8",
     location: "nyc",
     meetupGroupName: "DBCx-NYC"}
  ];

  $.each(locations, function(index, config) {
    MeetupAPI.fetch(config.signedQuery, MeetupEventHandler.responseHandler.bind(config));
  });
});

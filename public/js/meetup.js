;(function($, window, document, undefined) {
    "use strict";

    // plugin variables and constructor

    var pluginName = "meetupEventFetcher",
        // TODO: any defaults needed? client-side template of some sort?
        defaults = {};

    var Plugin = function(element, options) {
        this.element = element;
        this.$element = $(element);

        this.settings = $.extend({}, defaults, options);

        this._defaults = defaults;
        this._name = pluginName;

        this._events = [];

        this.init();
    };

    // event constructor

    var Event = function(opts) {
        this.isDateTimeValid = true;

        this.name = opts.name;
        this.date = this.formatDate(opts.date);
        this.time = this.formatTime(opts.date);
        this.url = opts.url;

        // element will eventually be created using event data
        this.el = null;

        this.initialize();
    };

    Event.prototype.initialize = function() {
        console.log('init event: ', this);

        this.checkDateTimeValidity();

        this.createElement();
    };

    Event.prototype.formatDate = function(dateTime) {
        var dateObj = new Date(dateTime);

        try {
            // toDateString returns format of: Mon May 11 2015
            return dateObj.toDateString();
        }
        catch(err) {
            console.log(pluginName, ': could not format date; check the format!');

            this.isDateTimeValid = false;
        }
    };

    Event.prototype.formatTime = function(dateTime) {
        var dateObj = new Date(dateTime),
            localeString = null,
            rawTime = null,
            timeWithoutSeconds = null,
            amPmEnding = null,
            timeString = null,
            timeZone = null;

        try {
            // toLocaleString returns format of: 5/11/2015, 3:30:00 PM
            localeString = dateObj.toLocaleString();

            // grab just the time (HH:MM:SS) and AM/PM
            rawTime = localeString.substr(localeString.indexOf(' ') + 1);
            console.log(rawTime);

            // slice the seconds off the time, leaving only hours and minutes
            timeWithoutSeconds = rawTime.slice(0, rawTime.lastIndexOf(':'));
            console.log(timeWithoutSeconds);

            // grab the "AM" or "PM" ending
            amPmEnding = rawTime.substr(rawTime.lastIndexOf(' ') + 1);
            console.log(amPmEnding);

            // toTimeString returns format of: 15:30:00 GMT-0700 (PDT)
            timeString = dateObj.toTimeString();

            // grab the time zone abbreviation
            timeZone = timeString.substr(timeString.lastIndexOf(' ') + 1);
            console.log(timeZone);

            return timeWithoutSeconds + ' ' + amPmEnding + ' ' + timeZone;
        }
        catch(err) {
            console.log(pluginName, ': could not format time; check the format!');

            this.isDateTimeValid = false;
        }
    };

    Event.prototype.checkDateTimeValidity = function() {
        if (!this.isDateTimeValid) {
            this.date = 'see event website for details';
            this.time = '';
        }
    };

    Event.prototype.createElement = function() {
        var eventHtml = '<li>' +
                            '<strong class="dbc-location-event-list__header">' + this.name + '</strong>' +
                            '<span class="dbc-location-event-list__details">' + this.date + ' @ ' + this.time + '</span>' +
                            '<a href="' + this.url + '" class="dbc-location-event-list__rsvp">' +
                                'RSVP <i class="fa fa-angle-double-right" aria-hidden="true"></i>' +
                            '</a>' +
                        '</li>';

        this.el = $.parseHTML(eventHtml);
    };

    // plugin prototypal methods

    $.extend(Plugin.prototype, {
        init: function() {
            this._events.push(new Event({
                name: 'fake event',
                date: 1431383400000,
                time: 1431383400000,
                url: 'http://www.metup.com/lol'
            }));

            this.renderEvents();

            // this.retrieveEvents(this.settings.groupName, this.settings.sigId, this.settings.sig);
        },
        retrieveEvents: function(groupName, sigId, sig) {
            var that = this;

            // TODO: some sort of loading indicator within element waiting for events?

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
            // TODO: add some methods to show specific http response code errors?
            .done(this.createEvents.bind(this))
            .fail(function(err) {
                console.log(that._name, ': api call failed; check your datatype, query params, and signature!');
            })
            .always(function() {
                // TODO: remove loading indicator from element?
            });
        },
        createEvents: function(data) {
            var that = this,
                events = data.results;

            // a failed jsonp request still succeeds, unfortunately, so we'll use a
            //  try/catch to make sure we have actual data
            try {
                // TODO: need to handle missing properties?
                $.each(events, function(idx, item) {
                    that._events.push(new Event({
                        name: item.name,
                        date: item.time,
                        time: item.time,
                        url: item.event_url
                    }));
                });
            }
            catch(err) {
                console.log(that._name, ': api call failed; check your rate limit, query params, and signature!');
            }

            if (this._events.length) {
                this.renderEvents();
            }
        },
        renderEvents: function() {
            var that = this;

            $.each(this._events, function(idx, item) {
                that.$element.append(item.el);
            });
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
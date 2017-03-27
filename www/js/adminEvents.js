function Events(main) {
    "use strict";

    var that = this;
    this.main = main;
    
    this.menuIcon = 'fa-tint';
  
    var eventsLinesCount = 0;
    var eventsLinesStart = 0;
    var eventTypes = [];
    var eventFroms = [];
    var eventFilterTimeout = null;

    this.eventLimit = 500;
    this.eventPauseList = [];
    this.eventPauseMode = false;
    this.eventPauseOverflow = false;
    this.eventPauseCounterSpan = null;
    this.eventPauseCounter = [];

    this.prepare = function () {
    };

    // ----------------------------- Show events ------------------------------------------------
    this.addEventMessage = function (id, state, rowData, obj) {
    };

    function filterEvents() {
    }

    this.pause = function () {
    };
}


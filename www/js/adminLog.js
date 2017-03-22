function Logs(main) {
    'use strict';

    var that = this;
    this.main = main;
    this.logLimit = 2000; //const

    this.logLinesCount = 0;
    this.logLinesStart = 0;
    this.logHosts = [];
    this.logFilterTimeout = null;
    this.logFilterHost = '';
    this.logFilterSeverity = '';
    this.logFilterMessage = '';
    this.$logFilterHost = null;
    this.$logFilterSeverity = null;
    this.$logFilterMessage = null;

    this.logPauseList = [];
    this.logPauseMode = false;
    this.logPauseOverflow = false;
    this.logPauseCounterSpan = null;
    this.logPauseCounter = [];

    this.prepare = function () {
    };

    function installColResize() {
    }

    // -------------------------------- Logs ------------------------------------------------------------
    this.init = function () {
    };

    this.add = function (message) {
    };

    this.filter = function () {
    };

    this.clear = function (isReload) {
    };

    this.pause = function () {
    };
}

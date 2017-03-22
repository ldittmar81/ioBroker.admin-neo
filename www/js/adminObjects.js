function Objects(main) {
    'use strict';

    var that = this;
   
    this.main = main;
    this.customEnabled = null;
    this.currentCustoms = null; // Id of the currently shown customs dialog
    
    this.prepare = function () {
    };

    function loadObjectFields(htmlId, object, part, objectType) {
    }

    function saveObjectFields(htmlId, object) {
    }

    this.stateChange = function (id, state) {
    };

    this.objectChange = function (id, obj) {
    };

    this.reinit = function () {
    };

    function _syncEnum(id, enumIds, newArray, cb) {
    }

    function syncEnum(id, enumName, newArray) {
    }

    this.init = function (update) {
    };

    this.edit = function (id, callback) {
    };

    this.load = function (obj) {
    };

    this.saveFromTabs = function () {
    };

    this.saveFromRaw = function () {
    };

    this.save = function () {
    };

    // ----------------------------- CUSTOMS ------------------------------------------------
    this.checkCustoms = function () {
    };

    this.stateChangeHistory = function (id, state) {
    };

    this.initCustomsTabs = function (ids, instances) {
    };

    this.loadHistoryTable = function (id, isSilent) {
    };

    this.loadHistoryChart = function (id) {
    };

    this.showCustomsData = function (id) {
    };

    function getCustomTemplate(adapter, callback) {
    }

    this.openCustomsDlg = function (ids) {
    };

    // Set modified custom states
    this.setCustoms = function (ids, callback) {
    };

    this.resizeHistory = function () {
    };

    this.prepareCustoms = function () {
    };

    function handleFileSelect(evt) {
    }
}
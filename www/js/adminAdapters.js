/* global systemLang, availableLanguages */

function Adapters(main) {
    'use strict';

    var that = this;

    this.curRepository = null;
    this.curRepoLastUpdate = null;
    this.curInstalled = null;
    this.list = [];
    this.main = main;
    this.tree = [];
    this.data = {};
    this.urls = {};
    this.groupImages = {
        'common adapters_group': 'img/group/common.png',
        'hardware_group': 'img/group/hardware.png', //will be deleted after split
        'platform_group': 'img/group/platform.png',
        'kitchen&home_group': 'img/group/kitchen.png',
        'garden_group': 'img/group/garden.png',
        'cameras': 'img/group/camera.png',
        'alarm': 'img/group/alarm.png',
        'script_group': 'img/group/script.png',
        'media_group': 'img/group/media.png',
        'communication_group': 'img/group/communication.png',
        'visualisation_group': 'img/group/visualisation.png',
        'storage_group': 'img/group/storage.png',
        'weather_group': 'img/group/weather.png',
        'schedule_group': 'img/group/schedule.png',
        'vis_group': 'img/group/vis.png',
        'service_group': 'img/group/service.png'
    };

    this.isList = false;
    this.filterVals = {length: 0};
    this.onlyInstalled = false;
    this.onlyUpdatable = false;
    this.currentFilter = '';
    this.isCollapsed = {};

    this.types = {
        occ: 'schedule'
    };

    this.prepare = function () {
       
    };

    this.updateExpertMode = function () {
       
    };

    function customFilter(node) {
      
    }

    this.getAdaptersInfo = function (host, update, updateRepo, callback) {
      
    };

    function getNews(actualVersion, adapter) {
       
    }

    function checkDependencies(dependencies) {
    
    }

    // ----------------------------- Adapters show and Edit ------------------------------------------------
    this.init = function (update, updateRepo) {
      
    };

    function showLicenseDialog(adapter, callback) {
    
    }

    this.initButtons = function (adapter) {
 
    };

    this.objectChange = function (id, obj) {
   
    };

    function showUploadProgress(group, adapter, percent) {
   
    }

    this.stateChange = function (id, state) {
   
    };
}

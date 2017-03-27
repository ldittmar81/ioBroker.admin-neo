/* global systemLang */
/* global semver */

function Adapters(main) {
    'use strict';

    var that = this;

    this.curRepository = null;
    this.curRepoLastUpdate = null;
    this.curInstalled = null;
    this.menuIcon = 'fa-plug';
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
        $('#menu-adapters-div').load("templates/adapters.html", function () {
            restartFunctions('menu-adapters-div');
        });

    };

    this.updateExpertMode = function () {
        this.init(true);
        if (that.main.config.expertMode) {
            $('#btn-adapters-expert-mode').addClass('btn-danger');
            $('#btn_upgrade_all').show();
        } else {
            $('#btn-adapters-expert-mode').removeClass('btn-danger');

            if (that.onlyUpdatable) {
                $('#btn_upgrade_all').show();
            } else {
                $('#btn_upgrade_all').hide();
            }
        }
    };

    function customFilter(node) {

        if (that.currentFilter) {
            if (!that.data[node.key]) {
                return false;
            }

            if ((that.data[node.key].name && that.data[node.key].name.toLowerCase().indexOf(that.currentFilter) !== -1) ||
                    (that.data[node.key].title && that.data[node.key].title.toLowerCase().indexOf(that.currentFilter) !== -1) ||
                    (that.data[node.key].keywords && that.data[node.key].keywords.toLowerCase().indexOf(that.currentFilter) !== -1) ||
                    (that.data[node.key].desc && that.data[node.key].desc.toLowerCase().indexOf(that.currentFilter) !== -1)) {
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }

    }

    this.getAdaptersInfo = function (host, update, updateRepo, callback) {
        if (!host) {
            return;
        }

        if (!callback) {
            throw 'Callback cannot be null or undefined';
        }
        if (update) {
            // Do not update too often
            if (!this.curRepoLastUpdate || ((new Date()).getTime() - this.curRepoLastUpdate > 1000)) {
                this.curRepository = null;
                this.curInstalled = null;
            }
        }

        if (this.curRunning) {
            this.curRunning.push(callback);
            return;
        }

        if (!this.curRepository) {
            this.main.socket.emit('sendToHost', host, 'getRepository', {repo: this.main.systemConfig.common.activeRepo, update: updateRepo}, function (_repository) {
                if (_repository === 'permissionError') {
                    console.error('May not read "getRepository"');
                    _repository = {};
                }

                that.curRepository = _repository || {};
                if (that.curRepository && that.curInstalled && that.curRunning) {
                    that.curRepoLastUpdate = (new Date()).getTime();
                    setTimeout(function () {
                        for (var c = 0; c < that.curRunning.length; c++) {
                            that.curRunning[c](that.curRepository, that.curInstalled);
                        }
                        that.curRunning = null;
                    }, 0);
                }
            });
        }
        if (!this.curInstalled) {
            this.main.socket.emit('sendToHost', host, 'getInstalled', null, function (_installed) {
                if (_installed === 'permissionError') {
                    console.error('May not read "getInstalled"');
                    _installed = {};
                }

                that.curInstalled = _installed || {};
                if (that.curRepository && that.curInstalled) {
                    that.curRepoLastUpdate = (new Date()).getTime();
                    setTimeout(function () {
                        for (var c = 0; c < that.curRunning.length; c++) {
                            that.curRunning[c](that.curRepository, that.curInstalled);
                        }
                        that.curRunning = null;
                    }, 0);
                }
            });
        }

        if (this.curInstalled && this.curRepository) {
            setTimeout(function () {
                if (that.curRunning) {
                    for (var c = 0; c < that.curRunning.length; c++) {
                        that.curRunning[c](that.curRepository, that.curInstalled);
                    }
                    that.curRunning = null;
                }
                if (callback)
                    callback(that.curRepository, that.curInstalled);
            }, 0);
        } else {
            this.curRunning = [callback];
        }
    };

    function getNews(actualVersion, adapter) {
        var text = '';
        if (adapter.news) {
            for (var v in adapter.news) {
                if (systemLang === v)
                    text += (text ? '\n' : '') + adapter.news[v];
                if (v === 'en' || v === 'ru' || v === 'de')
                    continue;
                if (v === actualVersion)
                    break;
                text += (text ? '\n' : '') + (adapter.news[v][systemLang] || adapter.news[v].en);
            }
        }
        return text;
    }

    function checkDependencies(dependencies) {
        if (!dependencies)
            return '';
        // like [{"js-controller": ">=0.10.1"}]
        var adapters;
        if (dependencies instanceof Array) {
            adapters = {};
            for (var a = 0; a < dependencies.length; a++) {
                if (typeof dependencies[a] === 'string')
                    continue;
                for (var b in dependencies[a])
                    adapters[b] = dependencies[a][b];
            }
        } else {
            adapters = dependencies;
        }

        for (var adapter in adapters) {
            if (adapter === 'js-controller') {
                if (!semver.satisfies(that.main.objects['system.host.' + that.main.currentHost].common.installedVersion, adapters[adapter]))
                    return $.i18n('Invalid version of $1. Required $2', adapter, adapters[adapter]);
            } else {
                if (!that.main.objects['system.adapter.' + adapter] || !that.main.objects['system.adapter.' + adapter].common || !that.main.objects['system.adapter.' + adapter].common.installedVersion)
                    return $.i18n('No version of $1', adapter);
                if (!semver.satisfies(that.main.objects['system.adapter.' + adapter].common.installedVersion, adapters[adapter]))
                    return $.i18n('Invalid version of $1', adapter);
            }
        }
        return '';
    }

    // ----------------------------- Adapters show and Edit ------------------------------------------------
    this.init = function (update, updateRepo) {
        if (!this.main.objectsLoaded) {
            setTimeout(function () {
                that.init();
            }, 250);
            return;
        }

        this.main.fillContent('#menu-adapters-div');
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

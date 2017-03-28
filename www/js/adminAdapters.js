/* global systemLang */
/* global semver */

function Adapters(main) {
    'use strict';

    var that = this;

    var $groupTemplate, $adapterTemplate, $adapterNewTemplate, $adapterTemplateInside, $adapterContainer;

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

            $adapterContainer = $('#adapter-container');
            $groupTemplate = $('#adapterTemplateGroup');
            $adapterTemplate = $('#adapterTemplateAdapter');
            $adapterNewTemplate = $('#adapterTemplateNewAdapter');
            $adapterTemplateInside = $('#adapterTemplateAdapterInside');

            $('#btn_collapse_adapters').click(function () {
            });
            $('#btn_expand_adapters').click(function () {
            });
            $('#btn_list_adapters').click(function () {
                that.isList = !that.isList;
                if (that.isList) {
                    $('#btn_list_adapters').switchClass('btn-default', 'btn-primary');
                    $('#btn_expand_adapters').hide();
                    $('#btn_collapse_adapters').hide();
                    $(this).attr('title', $.i18n('list'));
                } else {
                    $('#btn_list_adapters').switchClass('btn-default', 'btn-primary');
                    $('#btn_expand_adapters').show();
                    $('#btn_collapse_adapters').show();
                    $(this).attr('title', $.i18n('tree'));
                }
                that.main.saveConfig('adaptersIsList', that.isList);

                setTimeout(function () {
                    that.init(true);
                }, 200);
            });

            $('#btn_filter_adapters').click(function () {
                that.onlyInstalled = !that.onlyInstalled;
                if (that.onlyInstalled) {
                    $('#btn_filter_adapters').switchClass('btn-default', 'btn-primary');
                } else {
                    $('#btn_filter_adapters').switchClass('btn-default', 'btn-primary');
                }
                that.main.saveConfig('adaptersOnlyInstalled', that.onlyInstalled);

                setTimeout(function () {
                    that.init(true);
                }, 200);
            });

            $('#btn_filter_updates').click(function () {
                that.onlyUpdatable = !that.onlyUpdatable;
                if (that.onlyUpdatable) {
                    $('#btn_filter_updates').switchClass('btn-default', 'btn-primary');
                    $('#btn_upgrade_all').show();
                } else {
                    $('#btn_filter_updates').switchClass('btn-default', 'btn-primary');
                    $('#btn_upgrade_all').hide();
                }
                that.main.saveConfig('adaptersOnlyUpdatable', that.onlyUpdatable);

                setTimeout(function () {
                    that.init(true);
                }, 200);
            });

            $('#btn_upgrade_all').click(function () {
                that.main.confirmMessage($.i18n('Do you want to upgrade all adapters?'), $.i18n('Question'), 'help', function (result) {
                    if (result) {
                        that.main.cmdExec(null, 'upgrade', function (exitCode) {
                            if (!exitCode)
                                that.init(true);
                        });
                    }
                });
            });

            $('#btn-adapters-expert-mode').click(function () {
                that.main.config.expertMode = !that.main.config.expertMode;
                that.main.saveConfig('expertMode', that.main.config.expertMode);
                that.updateExpertMode();
                that.main.tabs.instances.updateExpertMode();
            });
            if (that.main.config.expertMode) {
                $('#btn-adapters-expert-mode').switchClass('btn-default', 'btn-primary');
            }

            // save last selected adapter
            $('#install-github-link').change(function () {
                that.main.saveConfig('adaptersGithub', $(this).val());
            });
            $('#install-url-link').keyup(function (event) {
                if (event.which === 13) {
                    $('#dialog-install-url-button').trigger('click');
                }
            });

            // Load settings
            that.isList = that.main.config.adaptersIsList || false;
            that.onlyInstalled = that.main.config.adaptersOnlyInstalled || false;
            that.onlyUpdatable = that.main.config.adaptersOnlyUpdatable || false;
            that.currentFilter = that.main.config.adaptersCurrentFilter || '';
            that.isCollapsed = that.main.config.adaptersIsCollapsed ? JSON.parse(that.main.config.adaptersIsCollapsed) : {};
            $('#adapters-filter').val(that.currentFilter);

            if (that.isList) {
                $('#btn_list_adapters').attr('title', $.i18n('tree')).switchClass('btn-default', 'btn-primary');
                $('#btn_expand_adapters').hide();
                $('#btn_collapse_adapters').hide();
            }

            if (that.onlyInstalled) {
                $('#btn_filter_adapters').switchClass('btn-default', 'btn-primary');
            }

            if (that.onlyUpdatable || that.main.config.expertMode) {
                if (that.onlyUpdatable) {
                    $('#btn_filter_updates').switchClass('btn-default', 'btn-primary');
                }
                $('#btn_upgrade_all').show();
            } else {
                $('#btn_upgrade_all').hide();
            }

            $('#btn_refresh_adapters').click(function () {
                that.init(true, true);
            });

            // add filter processing
            $('#adapters-filter').keyup(function () {
                $(this).trigger('change');
            }).on('change', function () {
                if (that.filterTimer) {
                    clearTimeout(that.filterTimer);
                }
                that.filterTimer = setTimeout(function () {
                    that.filterTimer = null;
                    that.currentFilter = $('#adapters-filter').val().toLowerCase();
                    that.main.saveConfig('adaptersCurrentFilter', that.currentFilter);
                    //that.$grid.fancytree('getTree').filterNodes(customFilter, false);
                }, 400);
            });

        });

    };

    this.updateExpertMode = function () {
        this.init(true);
        if (that.main.config.expertMode) {
            $('#btn-adapters-expert-mode').switchClass('btn-default', 'btn-primary');
            $('#btn_upgrade_all').show();
        } else {
            $('#btn-adapters-expert-mode').switchClass('btn-default', 'btn-primary');

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
                if (!semver.satisfies(that.main.objects['system.host.' + that.main.currentHost].common.installedVersion, adapters[adapter])) {
                    return $.i18n('Invalid version of $1. Required $2', adapter, adapters[adapter]);
                }
            } else {
                if (!that.main.objects['system.adapter.' + adapter] || !that.main.objects['system.adapter.' + adapter].common || !that.main.objects['system.adapter.' + adapter].common.installedVersion) {
                    return $.i18n('No version of $1', adapter);
                }
                if (!semver.satisfies(that.main.objects['system.adapter.' + adapter].common.installedVersion, adapters[adapter])) {
                    return $.i18n('Invalid version of $1', adapter);
                }
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

        $adapterContainer.html('');

        this.getAdaptersInfo(this.main.currentHost, update, updateRepo, function (repository, installedList) {

            var obj;
            var version;
            var tmp;
            var adapter;

            var listInstalled = [];
            var listUnsinstalled = [];

            if (installedList) {
                for (adapter in installedList) {
                    if (!installedList.hasOwnProperty(adapter)) {
                        continue;
                    }
                    obj = installedList[adapter];
                    if (!obj || obj.controller || adapter === 'hosts') {
                        continue;
                    }
                    listInstalled.push(adapter);
                }
                listInstalled.sort();
            }

            that.urls = {};
            // List of adapters from repository
            for (adapter in repository) {
                if (!repository.hasOwnProperty(adapter)) {
                    continue;
                }
                that.urls[adapter] = repository[adapter].meta;
                obj = repository[adapter];
                if (!obj || obj.controller) {
                    continue;
                }
                version = '';
                if (installedList && installedList[adapter]) {
                    continue;
                }
                listUnsinstalled.push(adapter);
            }
            listUnsinstalled.sort();

            that.tree = [];
            that.data = {};

            // list of the installed adapters
            for (var i = 0; i < listInstalled.length; i++) {
                adapter = listInstalled[i];

                obj = installedList ? installedList[adapter] : null;

                if (obj) {
                    that.urls[adapter] = installedList[adapter].readme || installedList[adapter].extIcon || installedList[adapter].licenseUrl;
                    if (!that.urls[adapter]) {
                        delete that.urls[adapter];
                    }
                }

                if (!obj || obj.controller || adapter === 'hosts') {
                    continue;
                }
                var installed = '';
                var icon = obj.icon;
                version = '';

                if (repository[adapter] && repository[adapter].version) {
                    version = repository[adapter].version;
                }

                if (repository[adapter] && repository[adapter].extIcon) {
                    icon = repository[adapter].extIcon;
                }

                if (obj.version) {
                    var news = '';
                    var updatable = false;
                    var updatableError = '';
                    if (!that.main.upToDate(version, obj.version)) {
                        news = getNews(obj.version, repository[adapter]);
                        // check if version is compatible with current adapters and js-controller
                        updatable = true;
                        updatableError = checkDependencies(repository[adapter].dependencies);
                    }
                    installed = '<table style="border: 0; border-collapse: collapse;' + (news ? 'font-weight: bold;' : '') + '" cellspacing="0" cellpadding="0" class="ui-widget"><tr><td style="border: 0; padding: 0; width: 50px" title="' + news + '">' + obj.version + '</td>';

                    var _instances = 0;
                    var _enabled = 0;

                    // Show information about installed and enabled instances
                    for (var z = 0; z < that.main.instances.length; z++) {
                        if (main.objects[that.main.instances[z]].common.name === adapter) {
                            _instances++;
                            if (main.objects[that.main.instances[z]].common.enabled)
                                _enabled++;
                        }
                    }
                    if (_instances) {
                        installed += '<td style="border: 0; padding: 0; width:40px">[<span title="' + $.i18n('Installed instances') + '">' + _instances + '</span>';
                        if (_enabled) {
                            installed += '/<span title="' + $.i18n('Active instances') + '" class="true">' + _enabled + '</span>';
                        }
                        installed += ']</td>';
                    } else {
                        installed += '<td style="border: 0; padding: 0; width: 40px"></td>';
                    }

                    tmp = installed.split('.');
                    if (updatable) {
                        installed += '<td style="border: 0; padding: 0; width: 30px"><button class="adapter-update-submit" data-adapter-name="' + adapter + '" ' + (updatableError ? ' disabled title="' + updatableError + '"' : 'title="' + $.i18n('update') + '"') + '></button></td>';
                        version = version.replace('class="', 'class="updateReady ');
                        $('a[href="#tab-adapters"]').addClass('updateReady');
                    } else if (that.onlyUpdatable) {
                        continue;
                    }

                    installed += '</tr></table>';
                }
                if (version) {
                    tmp = version.split('.');
                    if (tmp[0] === '0' && tmp[1] === '0' && tmp[2] === '0') {
                        version = '<span class="planned" title="' + $.i18n("planned") + '">' + version + '</span>';
                    } else if (tmp[0] === '0' && tmp[1] === '0') {
                        version = '<span class="alpha" title="' + $.i18n("alpha") + '">' + version + '</span>';
                    } else if (tmp[0] === '0') {
                        version = '<span class="beta" title="' + $.i18n("beta") + '">' + version + '</span>';
                    } else if (version === 'npm error') {
                        version = '<span class="error" title="' + $.i18n("Cannot read version from NPM") + '">' + $.i18n('npm error') + '</span>';
                    } else {
                        version = '<span class="stable" title="' + $.i18n("stable") + '">' + version + '</span>';
                    }
                }

                var group = (obj.type || that.types[adapter] || 'common adapters') + '_group';
                var desc = (typeof obj.desc === 'object') ? (obj.desc[systemLang] || obj.desc.en) : obj.desc;
                desc += showUploadProgress(group, adapter, that.main.states['system.adapter.' + adapter + '.upload'] ? that.main.states['system.adapter.' + adapter + '.upload'].val : 0);

                that.data[adapter] = {
                    image: icon ? icon : '',
                    name: adapter,
                    title: (obj.title || '').replace('ioBroker Visualisation - ', ''),
                    desc: desc,
                    keywords: obj.keywords ? obj.keywords.join(' ') : '',
                    version: version,
                    installed: installed,
                    bold: obj.highlight || false,
                    install: '<button data-adapter-name="' + adapter + '" class="adapter-install-submit" title="' + $.i18n('add instance') + '"></button>' +
                            '<button ' + (obj.readme ? '' : 'disabled="disabled" ') + 'data-adapter-name="' + adapter + '" data-adapter-url="' + obj.readme + '" class="adapter-readme-submit" title="' + $.i18n('readme') + '"></button>' +
                            '<button ' + (installed ? '' : 'disabled="disabled" ') + 'data-adapter-name="' + adapter + '" class="adapter-delete-submit" title="' + $.i18n('delete adapter') + '"></button>' +
                            ((that.main.config.expertMode) ? '<button data-adapter-name="' + adapter + '" class="adapter-update-custom-submit" title="' + $.i18n('install specific version') + '"></button>' : ''),
                    platform: obj.platform,
                    group: group,
                    license: obj.license || '',
                    licenseUrl: obj.licenseUrl || ''
                };

                if (!obj.type) {
                    console.log('"' + adapter + '": "common adapters",');
                }
                if (obj.type && that.types[adapter]) {
                    console.log('Adapter "' + adapter + '" has own type. Remove from admin.');
                }

                if (!that.isList) {
                    var igroup = -1;
                    for (var j = 0; j < that.tree.length; j++) {
                        if (that.tree[j].key === that.data[adapter].group) {
                            igroup = j;
                            break;
                        }
                    }
                    if (igroup < 0) {
                        that.tree.push({
                            title: $.i18n(that.data[adapter].group),
                            desc: showUploadProgress(group),
                            key: that.data[adapter].group,
                            folder: true,
                            expanded: !that.isCollapsed[that.data[adapter].group],
                            children: [],
                            icon: that.groupImages[that.data[adapter].group]
                        });
                        igroup = that.tree.length - 1;
                    }
                    that.tree[igroup].children.push({
                        icon: icon,
                        title: that.data[adapter].title || adapter,
                        key: adapter
                    });
                } else {
                    that.tree.push({
                        icon: icon,
                        title: that.data[adapter].title || adapter,
                        key: adapter
                    });
                }
            }

            if (!that.onlyInstalled && !that.onlyUpdatable) {
                for (i = 0; i < listUnsinstalled.length; i++) {
                    adapter = listUnsinstalled[i];

                    obj = repository[adapter];
                    if (!obj || obj.controller) {
                        continue;
                    }
                    version = '';
                    if (installedList && installedList[adapter]) {
                        continue;
                    }

                    if (repository[adapter] && repository[adapter].version) {
                        version = repository[adapter].version;
                        tmp = version.split('.');
                        if (tmp[0] === '0' && tmp[1] === '0' && tmp[2] === '0') {
                            version = '<span class="planned" title="' + $.i18n("planned") + '">' + version + '</span>';
                        } else if (tmp[0] === '0' && tmp[1] === '0') {
                            version = '<span class="alpha" title="' + $.i18n("alpha") + '">' + version + '</span>';
                        } else if (tmp[0] === '0') {
                            version = '<span class="beta" title="' + $.i18n("beta") + '">' + version + '</span>';
                        } else if (version === 'npm error') {
                            version = '<span class="error" title="' + $.i18n("Cannot read version from NPM") + '">' + $.i18n('npm error') + '</span>';
                        } else {
                            version = '<span class="stable" title="' + $.i18n("stable") + '">' + version + '</span>';
                        }
                    }

                    var group = (obj.type || that.types[adapter] || 'common adapters') + '_group';
                    var desc = (typeof obj.desc === 'object') ? (obj.desc[systemLang] || obj.desc.en) : obj.desc;
                    desc += showUploadProgress(adapter, that.main.states['system.adapter.' + adapter + '.upload'] ? that.main.states['system.adapter.' + adapter + '.upload'].val : 0);

                    that.data[adapter] = {
                        image: repository[adapter].extIcon ? '<img src="' + repository[adapter].extIcon + '" width="22px" height="22px" />' : '',
                        name: adapter,
                        title: (obj.title || '').replace('ioBroker Visualisation - ', ''),
                        desc: desc,
                        keywords: obj.keywords ? obj.keywords.join(' ') : '',
                        version: version,
                        bold: obj.highlight,
                        installed: '',
                        install: '<button data-adapter-name="' + adapter + '" class="adapter-install-submit">' + $.i18n('add instance') + '</button>' +
                                '<button ' + (obj.readme ? '' : 'disabled="disabled" ') + ' data-adapter-name="' + adapter + '" data-adapter-url="' + obj.readme + '" class="adapter-readme-submit">' + $.i18n('readme') + '</button>' +
                                '<button disabled="disabled" data-adapter-name="' + adapter + '" class="adapter-delete-submit">' + $.i18n('delete adapter') + '</button>' +
                                ((that.main.config.expertMode) ? '<button data-adapter-name="' + adapter + '" class="adapter-update-custom-submit" title="' + $.i18n('install specific version') + '"></button>' : ''),
                        platform: obj.platform,
                        license: obj.license || '',
                        licenseUrl: obj.licenseUrl || '',
                        group: group
                    };

                    if (!obj.type) {
                        console.log('"' + adapter + '": "common adapters",');
                    }
                    if (obj.type && that.types[adapter]) {
                        console.log('Adapter "' + adapter + '" has own type. Remove from admin.');
                    }

                    if (!that.isList) {
                        var igroup = -1;
                        for (var j = 0; j < that.tree.length; j++) {
                            if (that.tree[j].key === that.data[adapter].group) {
                                igroup = j;
                                break;
                            }
                        }
                        if (igroup < 0) {
                            that.tree.push({
                                title: $.i18n(that.data[adapter].group),
                                key: that.data[adapter].group,
                                folder: true,
                                expanded: !that.isCollapsed[that.data[adapter].group],
                                children: [],
                                icon: that.groupImages[that.data[adapter].group]
                            });
                            igroup = that.tree.length - 1;
                        }
                        that.tree[igroup].children.push({
                            title: that.data[adapter].title || adapter,
                            icon: repository[adapter].extIcon,
                            desc: showUploadProgress(group),
                            key: adapter
                        });
                    } else {
                        that.tree.push({
                            icon: repository[adapter].extIcon,
                            title: that.data[adapter].title || adapter,
                            key: adapter
                        });
                    }
                }
            }
        });

        this.createAdapterList();

        this.main.fillContent('#menu-adapters-div');
    };

    this.createAdapterList = function () {
        for (var group in this.tree) {
            var $tempGroup = $groupTemplate.children().clone(true, true);
            $tempGroup.find('.group_title').text(group.title);
            $tempGroup.find('.group_img').attr('src', group.icon).attr('alt', group.title);
            
            for (var adapters in group.children){
                var $tempAdapterBorder = $adapterTemplate.children().clone(true, true);
                var $tempAdapterInner = $adapterTemplateInside.children().clone(true, true);
                
                $tempAdapterInner.find('.profile_img').attr('src', adapters.icon);
                $tempAdapterInner.find('.name').text(adapters.title);
                $tempAdapterInner.find('.description').text(adapters.desc);
                
                $tempAdapterBorder.find('.x_content').append($tempAdapterInner);
                $tempGroup.find('.adapterList').append($tempAdapterBorder);
            }

            $adapterContainer.append($tempGroup);
        }
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
